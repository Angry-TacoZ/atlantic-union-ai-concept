import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Eye, RotateCcw, ShieldCheck, Trash2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { memoryGovernance } from '../data/memory'
import type { CustomerMemory } from '../types'

interface MemoryPanelProps {
  open: boolean
  memory: CustomerMemory
  onClose: () => void
  onChange: (memory: CustomerMemory) => void
  onClear: () => void
  onRestore: () => void
  returnFocusRef: React.RefObject<HTMLButtonElement | null>
}

const editablePriorities = ['Clear monthly cost', 'Virginia branch access', 'Predictable growth', 'Easy digital access']

export function MemoryPanel({ open, memory, onClose, onChange, onClear, onRestore, returnFocusRef }: MemoryPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const returnFocusTarget = returnFocusRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !panelRef.current) return
      const controls = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button, input, textarea, [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute('disabled'))
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      returnFocusTarget?.focus()
    }
  }, [open, onClose, returnFocusRef])

  const togglePriority = (priority: string) => {
    const priorities = memory.priorities.includes(priority)
      ? memory.priorities.filter((item) => item !== priority)
      : [...memory.priorities, priority]
    onChange({ ...memory, priorities })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button className="panel-scrim" aria-label="Dismiss customer memory" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside ref={panelRef} className="memory-panel" role="dialog" aria-modal="true" aria-labelledby="memory-title" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: reducedMotion ? 0.01 : 0.25 }}>
            <div className="memory-heading">
              <div><span className="eyebrow"><Eye size={14} /> Customer-controlled memory</span><h2 id="memory-title">What the guide knows</h2></div>
              <button ref={closeRef} className="memory-close" onClick={onClose} aria-label="Close customer memory"><X /></button>
            </div>
            <p className="memory-intro"><strong>Fictional demo profile.</strong> Stored only in this browser. Nothing is sent to the bank or a model.</p>

            <label className="memory-switch">
              <span><strong>Use this memory</strong><small>Personalize explanations, never decisions.</small></span>
              <input type="checkbox" checked={memory.enabled} onChange={(event) => onChange({ ...memory, enabled: event.target.checked, acknowledged: true })} />
            </label>

            <section className="memory-section" aria-labelledby="profile-title">
              <div className="memory-section-title"><span>01</span><h3 id="profile-title">Customer profile</h3></div>
              <label>Preferred name<input maxLength={80} value={memory.customerName} onChange={(event) => onChange({ ...memory, customerName: event.target.value })} /></label>
              <div className="memory-fields">
                <label>Customer since<input maxLength={20} value={memory.relationshipSince} onChange={(event) => onChange({ ...memory, relationshipSince: event.target.value })} /></label>
                <label>Region<input maxLength={100} value={memory.region} onChange={(event) => onChange({ ...memory, region: event.target.value })} /></label>
              </div>
              <label>Current goal<textarea rows={3} maxLength={300} value={memory.goal} onChange={(event) => onChange({ ...memory, goal: event.target.value })} /></label>
              <label>Preferred way to get help<input maxLength={120} value={memory.preferredChannel} onChange={(event) => onChange({ ...memory, preferredChannel: event.target.value })} /></label>
              <fieldset><legend>Priorities the guide may use</legend>{editablePriorities.map((priority) => <label className="memory-check" key={priority}><input type="checkbox" checked={memory.priorities.includes(priority)} onChange={() => togglePriority(priority)} />{priority}</label>)}</fieldset>
            </section>

            <section className="memory-section" aria-labelledby="governance-title">
              <div className="memory-section-title"><span>02</span><h3 id="governance-title">Governance</h3></div>
              <dl className="governance-list"><div><dt>Source</dt><dd>{memoryGovernance.source}</dd></div><div><dt>Allowed purpose</dt><dd>{memoryGovernance.purpose}</dd></div><div><dt>Retention</dt><dd>{memoryGovernance.retention}</dd></div></dl>
            </section>

            <section className="memory-section risk-section" aria-labelledby="risk-title">
              <div className="memory-section-title"><span>03</span><h3 id="risk-title">Hard risk controls</h3></div>
              <ul>{memoryGovernance.never.map((boundary) => <li key={boundary}><ShieldCheck size={16} /><span><strong>Blocked</strong>{boundary}</span></li>)}</ul>
            </section>

            <div className="memory-actions">
              <button className="secondary-button" onClick={onRestore}><RotateCcw size={16} /> Restore demo profile</button>
              <button className="danger-button" onClick={onClear}><Trash2 size={16} /> Clear everything</button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
