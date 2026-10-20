import { AnimatePresence, motion, useReducedMotion, useSpring } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AgentCue } from '../types'

interface AmbientGuideProps {
  cue: AgentCue | null
}

export function AmbientGuide({ cue }: AmbientGuideProps) {
  const reducedMotion = useReducedMotion()
  const pointerX = useSpring(80, { stiffness: 420, damping: 38, mass: 0.55 })
  const pointerY = useSpring(80, { stiffness: 420, damping: 38, mass: 0.55 })
  const [position, setPosition] = useState({ x: 80, y: 80 })

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const x = Math.max(12, Math.min(event.clientX + 18, window.innerWidth - 330))
      const y = Math.max(12, Math.min(event.clientY + 18, window.innerHeight - 150))
      if (reducedMotion) setPosition({ x, y })
      else {
        pointerX.set(x)
        pointerY.set(y)
      }
    }
    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => window.removeEventListener('pointermove', handleMove)
  }, [pointerX, pointerY, reducedMotion])

  const x = cue?.anchor?.x ?? (reducedMotion ? position.x : pointerX)
  const y = cue?.anchor?.y ?? (reducedMotion ? position.y : pointerY)

  return (
    <AnimatePresence>
      {cue && (
        <motion.div
          key={cue.id}
          className="ambient-guide"
          style={{ x, y }}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.2 }}
        >
          <span className="guide-orb"><Sparkles size={13} /></span>
          <span className="guide-comment"><strong>AUB Guide</strong>{cue.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
