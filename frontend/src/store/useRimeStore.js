import { create } from 'zustand'

/**
 * phase :
 *   'intro'         → boot
 *   'eye'           → conversation principale (TheEye plein écran)
 *   'investigation' → layout sidebar + widgets
 *   'procedure'     → séquenceur plein écran
 *
 * widgets      : { [toolName]: data } — données chargées par le LLM
 * activeWidget : clé du widget en premier plan (null = aucun)
 */
export const useRimeStore = create((set) => ({
  phase:        'intro',
  rimeText:     '',
  isThinking:   false,
  widgets:      {},
  activeWidget: null,

  setPhase:    (phase) => set({ phase }),
  setRimeText: (text)  => set({ rimeText: text }),
  setThinking: (val)   => set({ isThinking: val }),

  // Charge un widget + démarre le zoom TheEye
  // EyePage appelle enterInvestigation() après le délai du zoom
  openWidget: (name, data) =>
    set((state) => ({
      widgets:      { ...state.widgets, [name]: data },
      activeWidget: name,
    })),

  // Bascule vers InvestigationPage après le zoom
  enterInvestigation: () => set({ phase: 'investigation' }),

  // Depuis InvestigationPage : active un widget existant
  setActiveWidget: (name) => set({ activeWidget: name }),

  // Retour à EyePage — reset complet
  returnToEye: () => set({
    phase:        'eye',
    widgets:      {},
    activeWidget: null,
    rimeText:     '',
    isThinking:   false,
  }),

  // Procédure plein écran
  enterProcedure: () => set({ phase: 'procedure', activeWidget: null }),
}))
