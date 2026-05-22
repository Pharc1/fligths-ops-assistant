import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import AircraftViewer from '../components/eye/AircraftViewer'
import TheEye from '../components/eye/TheEye'
import PanelRenderer from '../components/widgets/PanelRenderer'
import { useRimeStore } from '../store/useRimeStore'

export default function InvestigationPage() {
  const panels = useRimeStore((state) => state.panels)
  const activePanelId = useRimeStore((state) => state.activePanelId)
  const setActivePanel = useRimeStore((state) => state.setActivePanel)
  const returnToEye = useRimeStore((state) => state.returnToEye)
  const rimeText = useRimeStore((state) => state.rimeText)

  const activePanel = panels.find((panel) => panel.id === activePanelId) ?? panels[0]
  const secondaryPanels = panels.filter((panel) => panel.id !== activePanel?.id)

  return (
    <motion.div
      className="rime-investigation-page"
      key="investigation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <aside className="rime-visual-rail">
        <div className="rime-aircraft-stage">
          <AircraftViewer height="100%" />
          <div className="rime-eye-chip">
            <TheEye miniaturized />
          </div>
          <div className="rime-aircraft-grid" />
        </div>

        <div className="rime-aircraft-status">
          <button type="button" onClick={returnToEye}>
            <ArrowLeft size={14} />
            EYE
          </button>
          <div>
            <span>AIRCRAFT</span>
            <strong>F-GZCP / A330-203</strong>
          </div>
          <p>{rimeText || 'Dossier incident charge. RIME affiche uniquement les preuves utiles a la decision.'}</p>
        </div>
      </aside>

      <main className="rime-investigation-workspace">
        <header className="rime-workspace-header">
          <div>
            <span>MODE INVESTIGATION</span>
            <h1>Verifier la piste, pas lire un dossier complet.</h1>
          </div>
          <div className="rime-workspace-clock">
            <span>CDG MX OPS</span>
            <strong>{new Date().toLocaleTimeString('fr-FR')}</strong>
          </div>
        </header>

        <nav className="rime-panel-tabs" aria-label="Panels RIME">
          {panels.map((panel) => (
            <button
              type="button"
              key={panel.id}
              className={panel.id === activePanel?.id ? 'active' : ''}
              onClick={() => setActivePanel(panel.id)}
            >
              <span>{panel.mode}</span>
              {panel.title}
            </button>
          ))}
        </nav>

        <section className="rime-workspace-grid">
          <div className="rime-primary-panel">
            {activePanel ? <PanelRenderer panel={activePanel} /> : <EmptyPanel />}
          </div>

          <aside className="rime-secondary-stack">
            <div className="rime-decision-card">
              <span>FIL CONDUCTEUR</span>
              <p>
                RIME ne remplace pas la documentation. Il expose la preuve, la valeur ou le log qui
                justifie la prochaine verification.
              </p>
            </div>

            {secondaryPanels.map((panel) => (
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
        </section>
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
