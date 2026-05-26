import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useRimeStore } from '../../store/useRimeStore'

export default function AgentTrace({ floating = false }) {
  const activity = useRimeStore((state) => state.agentActivity)
  const steps = useRimeStore((state) => state.agentTrace)
  const isOpen = useRimeStore((state) => state.agentTraceOpen)
  const toggleAgentTrace = useRimeStore((state) => state.toggleAgentTrace)

  if (!activity && steps.length === 0) return null

  return (
    <motion.aside
      className={`rime-agent-trace ${floating ? 'is-floating' : 'is-dock'} ${isOpen ? 'is-open' : 'is-closed'}`}
      initial={{ opacity: 0, x: floating ? -8 : 0, y: floating ? 0 : 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <button
        type="button"
        className={`rime-agent-trace-toggle phase-${activity?.phase ?? 'idle'}`}
        onClick={toggleAgentTrace}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Masquer la trace agent' : 'Afficher la trace agent'}
      >
        <i />
        <span>{activity?.label ?? 'Trace'}</span>
        <ChevronRight size={14} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="rime-agent-drawer"
            initial={{ opacity: 0, x: floating ? -14 : 0, y: floating ? 0 : 8, scale: 0.985 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: floating ? -10 : 0, y: floating ? 0 : 6, scale: 0.985 }}
            transition={{ duration: 0.18 }}
          >
            <div className={`rime-agent-activity phase-${activity?.phase ?? 'idle'}`}>
              <span>AGENT</span>
              <strong>{activity?.label ?? 'Standby'}</strong>
            </div>

            <div className="rime-agent-steps">
              {steps.map((step) => (
                <div className={`rime-agent-step status-${step.status}`} key={step.id}>
                  <span>{step.kind}</span>
                  <strong>{step.label}</strong>
                  {step.detail && <p>{step.detail}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
