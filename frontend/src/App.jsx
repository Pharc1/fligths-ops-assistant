import { AnimatePresence } from 'framer-motion'
import { useRimeStore } from './store/useRimeStore'
import IntroPage from './pages/IntroPage'
import EyePage from './pages/EyePage'
import InvestigationPage from './pages/InvestigationPage'
import FilmGrain from './components/eye/FilmGrain'

export default function App() {
  const phase = useRimeStore((s) => s.phase)

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#080808' }}>
      <FilmGrain opacity={0.04} />
      <AnimatePresence mode="wait">
        {phase === 'intro'         && <IntroPage         key="intro"         />}
        {phase === 'eye'           && <EyePage           key="eye"           />}
        {phase === 'investigation' && <InvestigationPage key="investigation" />}
      </AnimatePresence>
    </div>
  )
}
