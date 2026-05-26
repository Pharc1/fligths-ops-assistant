import { motion } from 'framer-motion'
import AircraftViewer from '../components/eye/AircraftViewer'
import TheEye from '../components/eye/TheEye'
import AgentTrace from '../components/widgets/AgentTrace'
import PanelRenderer from '../components/widgets/PanelRenderer'
import RimePromptInput from '../components/widgets/RimePromptInput'
import { useRimeAsk } from '../hooks/useRimeAsk'
import { useRimeStore } from '../store/useRimeStore'

export default function InvestigationPage() {
  const panels = useRimeStore((state) => state.panels)
  const activePanelId = useRimeStore((state) => state.activePanelId)
  const setActivePanel = useRimeStore((state) => state.setActivePanel)
  const returnToEye = useRimeStore((state) => state.returnToEye)
  const rimeText = useRimeStore((state) => state.rimeText)
  const { input, setInput, submitQuestion } = useRimeAsk()

  const activePanel = panels.find((panel) => panel.id === activePanelId) ?? panels[0]
  const supportPanels = panels
    .filter((panel) => panel.id !== activePanel?.id)
    .filter((panel) => panel.mode !== 'notice')
  const canvasMode = activePanel?.mode ? `mode-${activePanel.mode}` : 'mode-empty'
  const canvasDensity = supportPanels.length > 0 ? 'has-support' : 'is-solo'

  return (
    <motion.div
      className="rime-investigation-page"
      key="investigation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <main className="rime-investigation-workspace">
        <header className="rime-workspace-header">
          <div className="rime-context-dock">
            <button type="button" onClick={returnToEye} className="rime-eye-return" aria-label="Retour a l'Eye">
              <TheEye miniaturized />
              <span>EYE</span>
            </button>

            <div className="rime-aircraft-context">
              <AircraftViewer height={74} />
              <div>
                <span>AIRCRAFT</span>
                <strong>F-GZCP / A330-203</strong>
              </div>
            </div>
          </div>

          <div className="rime-header-main">
            <div className="rime-header-topline">
              <span>CDG MX OPS / INVESTIGATION ACTIVE</span>
            </div>
            <span>MODE INVESTIGATION</span>
            <h1>Verifier la piste, pas lire un dossier complet.</h1>
            <p>{rimeText || 'RIME affiche uniquement les preuves utiles a la decision.'}</p>
          </div>
          <div className="rime-workspace-clock">
            <span>CDG MX OPS</span>
            <strong>{new Date().toLocaleTimeString('fr-FR')}</strong>
          </div>
        </header>

        <section className={`rime-adaptive-canvas ${canvasMode} ${canvasDensity}`}>
          <div className="rime-primary-panel">
            {activePanel ? <PanelRenderer panel={activePanel} /> : <EmptyPanel />}
          </div>

          {supportPanels.length > 0 && (
            <aside className="rime-support-rail" aria-label="Artifacts secondaires">
              <span className="rime-support-label">SUPPORT</span>
              {supportPanels.map((panel) => (
                <button
                  type="button"
                  className="rime-secondary-button"
                  key={panel.id}
                  onClick={() => setActivePanel(panel.id)}
                >
                  <PanelRenderer panel={panel} compact />
                </button>
              ))}
            </aside>
          )}
        </section>

        <div className="rime-investigation-prompt">
          <AgentTrace />
          <RimePromptInput
            input={input}
            setInput={setInput}
            onSubmit={submitQuestion}
            tone="dark"
            placeholder="Continuer l'investigation, demander une valeur ou ouvrir une source..."
          />
        </div>
      </main>
    </motion.div>
  )
}

function EmptyPanel() {
  return (
    <div className="rime-empty-panel">
      <span>EN ATTENTE</span>
      <p>Aucun panel affiche. Pose une question a RIME depuis l'ecran Eye.</p>
    </div>
  )
}
