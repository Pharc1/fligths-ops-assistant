import { useRef, useState } from 'react'
import { streamAgentAsk } from '../lib/rimeStream'
import { INVESTIGATION_MOCK_PANELS } from '../mock/rimePanels'
import { useRimeStore } from '../store/useRimeStore'

export function useRimeAsk({ enterInvestigationOnPanel = false } = {}) {
  const [input, setInput] = useState('')
  const hasEnteredInvestigation = useRef(false)

  const setRimeText = useRimeStore((state) => state.setRimeText)
  const setThinking = useRimeStore((state) => state.setThinking)
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

    if (question.toLowerCase().includes('affiche') || question.toLowerCase().includes('demo')) {
      setRimeText("J'ai isole une preuve documentaire, une valeur capteur et un historique court.")
      openPanels(INVESTIGATION_MOCK_PANELS)
      scheduleInvestigation()
      return
    }

    setThinking(true)
    setRimeText('Connexion au moteur RIME...')

    try {
      await streamAgentAsk({
        question,
        onEvent: (streamEvent) => {
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
          }

          if (streamEvent.type === 'error') {
            setThinking(false)
            setRimeText(streamEvent.message ?? 'Erreur agent RIME.')
          }
        },
      })
    } catch (error) {
      setThinking(false)
      setRimeText(`Backend indisponible: ${error.message}`)
    }
  }

  return {
    input,
    setInput,
    submitQuestion,
  }
}
