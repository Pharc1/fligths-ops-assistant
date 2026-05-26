import { create } from 'zustand'

function createPanelId(panel) {
  const base = [panel.mode, panel.title].filter(Boolean).join('-').toLowerCase()
  const safe = base.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${safe || 'panel'}-${Date.now()}`
}

function normalizePanel(panel) {
  const source = panel?.panel ?? panel ?? {}
  const mode = source.mode ?? 'notice'
  const title = source.title ?? mode.toUpperCase()

  return {
    id: source.id ?? createPanelId({ mode, title }),
    mode,
    title,
    priority: source.priority ?? (mode === 'document' ? 'primary' : 'secondary'),
    payload: source.payload ?? {},
  }
}

function documentWidgetToPanel(data) {
  return normalizePanel({
    mode: 'document',
    title: data?.title ?? 'PREUVE DOCUMENTAIRE',
    priority: 'primary',
    payload: data ?? {},
  })
}

function createTraceId(step) {
  return `${step.kind ?? 'step'}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useRimeStore = create((set) => ({
  phase: 'intro',
  rimeText: '',
  isThinking: false,
  agentActivity: null,
  agentTrace: [],

  widgets: {},
  activeWidget: null,
  panels: [],
  activePanelId: null,

  setPhase: (phase) => set({ phase }),
  setRimeText: (text) => set({ rimeText: text }),
  setThinking: (value) => set({ isThinking: value }),
  setAgentActivity: (activity) => set({ agentActivity: activity }),
  resetAgentTrace: () => set({ agentTrace: [], agentActivity: null }),
  pushAgentTrace: (step) =>
    set((state) => ({
      agentTrace: [
        {
          id: createTraceId(step),
          status: 'running',
          timestamp: new Date().toLocaleTimeString('fr-FR'),
          ...step,
        },
        ...state.agentTrace,
      ].slice(0, 7),
    })),

  addPanel: (panelData) => {
    const panel = normalizePanel(panelData)
    set((state) => ({
      panels: [...state.panels.filter((item) => item.id !== panel.id), panel],
      activePanelId:
        panel.priority === 'primary' || !state.activePanelId ? panel.id : state.activePanelId,
      activeWidget: panel.id,
    }))
    return panel.id
  },

  openPanels: (panelList) => {
    const panels = panelList.map(normalizePanel)
    const active = panels.find((panel) => panel.priority === 'primary') ?? panels[0]
    set({
      panels,
      activePanelId: active?.id ?? null,
      activeWidget: active?.id ?? null,
    })
  },

  openWidget: (name, data) => {
    const panel = name === 'display_document' ? documentWidgetToPanel(data) : normalizePanel(data)
    set((state) => ({
      widgets: { ...state.widgets, [name]: data },
      panels: [...state.panels.filter((item) => item.id !== panel.id), panel],
      activePanelId: panel.id,
      activeWidget: panel.id,
    }))
  },

  enterInvestigation: () => set({ phase: 'investigation' }),
  setActiveWidget: (name) => set({ activeWidget: name }),
  setActivePanel: (id) => set({ activePanelId: id, activeWidget: id }),

  returnToEye: () =>
    set({
      phase: 'eye',
      widgets: {},
      activeWidget: null,
      panels: [],
      activePanelId: null,
      rimeText: '',
      isThinking: false,
      agentActivity: null,
      agentTrace: [],
    }),

  enterProcedure: () => set({ phase: 'procedure', activeWidget: null }),
}))
