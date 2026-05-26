import { motion } from 'framer-motion'
import { useRimeStore } from '../../store/useRimeStore'

export default function AgentTrace({ floating = false }) {
  const activity = useRimeStore((state) => state.agentActivity)
  const steps = useRimeStore((state) => state.agentTrace)

  if (!activity && steps.length === 0) return null

  return (
    <motion.aside
      className={`rime-agent-trace ${floating ? 'is-floating' : 'is-dock'}`}
      initial={{ opacity: 0, x: floating ? -8 : 0, y: floating ? 0 : 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className={`rime-agent-activity phase-${activity?.phase ?? 'idle'}`}>
        <i />
        <div>
          <span>TRACE AGENT</span>
          <strong>{activity?.label ?? 'Standby'}</strong>
        </div>
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
    </motion.aside>
  )
}
