import { useRef, useState } from 'react'
import { streamAgentAsk } from '../lib/rimeStream'
import { INVESTIGATION_MOCK_PANELS } from '../mock/rimePanels'
import { useRimeStore } from '../store/useRimeStore'

export function useRimeAsk({ enterInvestigationOnPanel = false } = {}) {
  const [input, setInput] = useState('')
  const hasEnteredInvestigation = useRef(false)
  const clearTraceTimer = useRef(null)

  const setRimeText = useRimeStore((state) => state.setRimeText)
  const setThinking = useRimeStore((state) => state.setThinking)
  const setAgentActivity = useRimeStore((state) => state.setAgentActivity)
  const upsertAgentTrace = useRimeStore((state) => state.upsertAgentTrace)
  const resetAgentTrace = useRimeStore((state) => state.resetAgentTrace)
  const addPanel = useRimeStore((state) => state.addPanel)
  const openPanels = useRimeStore((state) => state.openPanels)
  const enterInvestigation = useRimeStore((state) => state.enterInvestigation)

  const scheduleInvestigation = () => {
    if (!enterInvestigationOnPanel || hasEnteredInvestigation.current) return
    hasEnteredInvestigation.current = true
    window.setTimeout(() => enterInvestigation(), 650)
  }

  const submitQuestion = async (event) => {
    event?.preventDefault()
    const question = input.trim()
    if (!question) return

    setInput('')
    hasEnteredInvestigation.current = false
    window.clearTimeout(clearTraceTimer.current)
    resetAgentTrace()

    if (question.toLowerCase().includes('affiche') || question.toLowerCase().includes('demo')) {
      setRimeText("J'ai isole une preuve documentaire, une valeur capteur et un historique court.")
      setAgentActivity({ label: 'Panneaux demo', phase: 'tool' })
      upsertAgentTrace({
        key: 'demo-panel',
        kind: 'panel',
        label: 'Demo panels',
        detail: 'document + telemetry + history',
        status: 'done',
      })
      scheduleTraceClear(resetAgentTrace, clearTraceTimer)
      openPanels(INVESTIGATION_MOCK_PANELS)
      scheduleInvestigation()
      return
    }

    setThinking(true)
    setRimeText('')
    setAgentActivity({ label: 'Raisonnement', phase: 'thinking' })

    try {
      await streamAgentAsk({
        question,
        onEvent: (streamEvent) => {
          trackStreamEvent(streamEvent, { setAgentActivity, upsertAgentTrace })

          if (streamEvent.type === 'assistant_delta') {
            setRimeText(streamEvent.content ?? streamEvent.data?.content ?? '')
          }

          if (streamEvent.type === 'panel') {
            addPanel(streamEvent.panel ?? streamEvent.data?.panel)
            scheduleInvestigation()
          }

          if (streamEvent.type === 'tool_use') {
            setThinking(true)
          }

          if (streamEvent.type === 'result') {
            setThinking(false)
            const content = streamEvent.content ?? streamEvent.data?.content
            if (content) setRimeText(content)
            scheduleTraceClear(resetAgentTrace, clearTraceTimer)
          }

          if (streamEvent.type === 'error') {
            setThinking(false)
            setAgentActivity({ label: 'Erreur agent', phase: 'error' })
            setRimeText(streamEvent.message ?? 'Erreur agent RIME.')
            scheduleTraceClear(resetAgentTrace, clearTraceTimer, 2600)
          }
        },
      })
    } catch (error) {
      setThinking(false)
      setAgentActivity({ label: 'Backend indisponible', phase: 'error' })
      setRimeText(`Backend indisponible: ${error.message}`)
      scheduleTraceClear(resetAgentTrace, clearTraceTimer, 2600)
    }
  }

  return {
    input,
    setInput,
    submitQuestion,
  }
}

function trackStreamEvent(streamEvent, { setAgentActivity, upsertAgentTrace }) {
  if (streamEvent.type === 'system_init') {
    setAgentActivity({ label: 'Skills / tools', phase: 'thinking' })
  }

  if (streamEvent.type === 'message_start') {
    setAgentActivity({ label: 'Raisonnement', phase: 'thinking' })
    upsertAgentTrace({
      key: 'reasoning',
      kind: 'reasoning',
      label: 'Raisonnement',
      detail: streamEvent.message_id ?? 'tour courant',
      status: 'running',
    })
  }

  if (streamEvent.type === 'assistant_delta') {
    setAgentActivity({ label: 'Formulation reponse', phase: 'thinking' })
  }

  if (streamEvent.type === 'tool_use') {
    const toolLabel = labelTool(streamEvent.toolName)
    setAgentActivity({ label: toolLabel, phase: 'tool' })
    upsertAgentTrace({
      key: toolKey(streamEvent),
      kind: 'tool',
      label: toolLabel,
      detail: summarizeToolInput(streamEvent.input),
      status: 'running',
    })
  }

  if (streamEvent.type === 'tool_result') {
    const toolLabel = labelTool(streamEvent.toolName)
    upsertAgentTrace({
      key: toolKey(streamEvent),
      kind: 'tool',
      label: toolLabel,
      ...(streamEvent.isError ? { detail: 'echec tool' } : {}),
      status: streamEvent.isError ? 'error' : 'done',
    })
  }

  if (streamEvent.type === 'panel') {
    setAgentActivity({ label: 'Preuve preparee', phase: 'tool' })
  }

  if (streamEvent.type === 'workflow') {
    setAgentActivity({ label: 'Plan mis a jour', phase: 'tool' })
  }
}

function scheduleTraceClear(resetAgentTrace, clearTraceTimer, delay = 1500) {
  window.clearTimeout(clearTraceTimer.current)
  clearTraceTimer.current = window.setTimeout(() => {
    resetAgentTrace()
  }, delay)
}

function labelTool(toolName) {
  const labels = {
    rag_search: 'Recherche documentaire',
    display_panel: 'Preparation affichage',
    workflow_get: 'Lecture planner',
    workflow_apply: 'Mise a jour planner',
    write_report: 'Synthese rapport',
  }

  return labels[toolName] ?? toolName ?? 'Tool agent'
}

function summarizeToolInput(input) {
  if (!input) return ''
  if (input.query) return input.query
  if (input.mode) return `${input.mode}${input.title ? ` / ${input.title}` : ''}`
  if (input.action) return input.action
  return Object.keys(input).slice(0, 3).join(', ')
}

function toolKey(streamEvent) {
  return `tool:${streamEvent.toolUseId ?? streamEvent.toolName ?? 'unknown'}`
}
