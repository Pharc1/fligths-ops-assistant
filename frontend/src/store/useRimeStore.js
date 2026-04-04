import { create } from 'zustand'

/**
 * Store global de RIME.
 *
 * phase :
 *   'intro'       → page d'accueil fond ivoire
 *   'eye'         → mode écoute, TheEye plein écran
 *   'investigation' → layout 2 colonnes (doc + historique)
 *   'procedure'   → layout procédure pas à pas
 *
 * rimeText : ce que RIME dit en ce moment (affiché dans TheEye)
 * isThinking : true pendant que l'agent travaille (streamlines s'agitent)
 * widgets : map des widgets actifs { display_document: {...}, ... }
 */
export const useRimeStore = create((set) => ({
  phase: 'intro',
  rimeText: '',
  isThinking: false,
  widgets: {},

  setPhase: (phase) => set({ phase }),

  setRimeText: (text) => set({ rimeText: text }),

  setThinking: (val) => set({ isThinking: val }),

  setWidget: (name, data) =>
    set((state) => ({
      widgets: { ...state.widgets, [name]: data },
    })),

  clearWidgets: () => set({ widgets: {} }),

  // Transition : TheEye → layout Investigation
  enterInvestigation: () =>
    set({ phase: 'investigation', isThinking: false }),

  // Transition : retour à TheEye depuis un layout
  returnToEye: () =>
    set({ phase: 'eye', widgets: {}, rimeText: '' }),
}))
