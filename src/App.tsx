import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  Brain,
  House,
  Landmark,
  Menu,
  MessageCircleQuestion,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react'
import { FormEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AmbientGuide } from './components/AmbientGuide'
import { MemoryPanel } from './components/MemoryPanel'
import { clearCustomerMemory, loadCustomerMemory, restoreCustomerMemory, saveCustomerMemory } from './lib/memory'
import type { AgentCue } from './types'

type GoalKey = 'routing' | 'checking' | 'saving' | 'home'

interface GuideAnswer {
  eyebrow: string
  title: string
  body: string
  evidence: string[]
  action: string
  target: string
}

const answers: Record<GoalKey, GuideAnswer> = {
  routing: {
    eyebrow: 'Direct answer',
    title: 'Atlantic Union Bank’s routing number is 051403164.',
    body: 'You can use this number for common ACH and direct-deposit setup. Wire instructions can differ, so confirm those before sending funds.',
    evidence: ['Routing number shown in the current site header and footer', 'No account information is needed for this answer'],
    action: 'See contact options',
    target: '#contact',
  },
  checking: {
    eyebrow: 'A useful starting point',
    title: 'Start with checking, then compare the conditions that change the value.',
    body: 'The current offer advertises up to an $800 cash bonus when qualifying activities are met. A bonus should not replace checking fees, access, and ongoing fit in the decision.',
    evidence: ['Current homepage cash-bonus language'],
    action: 'Compare three directions',
    target: '#compare',
  },
  saving: {
    eyebrow: 'Based on your goal',
    title: 'Predictable timeline? A CD may deserve the first look.',
    body: 'Money Market keeps access more flexible. CDs trade flexibility for a fixed rate and predictable term. The right answer depends on when you need the money.',
    evidence: ['Money Market: “A place for your money to grow”', 'CDs: fixed-rate growth with security and predictability'],
    action: 'See savings paths',
    target: '#products',
  },
  home: {
    eyebrow: 'Plan before applying',
    title: 'Separate “how much can I borrow?” from “what payment fits?”',
    body: 'Atlantic Union offers home loans and home equity lines of credit. This demo can prepare questions and tradeoffs, but only a banker or formal application can confirm eligibility and terms.',
    evidence: ['Home loan and HELOC categories from the current homepage', 'No credit or personal data is used in this concept'],
    action: 'Prepare for an appointment',
    target: '#appointment',
  },
}

const promptMap: Array<{ label: string; key: GoalKey }> = [
  { label: 'Find the routing number', key: 'routing' },
  { label: 'Choose a checking account', key: 'checking' },
  { label: 'Grow savings predictably', key: 'saving' },
  { label: 'Plan for a home', key: 'home' },
]

const products = [
  {
    icon: Banknote,
    name: 'Checking',
    copy: 'Find your go-to account in no time.',
    cue: 'Best place to begin when everyday access and direct deposit matter most.',
  },
  {
    icon: TrendingUp,
    name: 'Money Market',
    copy: 'A place for your money to grow.',
    cue: 'A more flexible savings direction when you may need access to the funds.',
  },
  {
    icon: CircleDollarSign,
    name: 'CDs',
    copy: 'Give your savings a boost.',
    cue: 'A fixed-rate direction when timing is known and predictability matters.',
  },
  {
    icon: House,
    name: 'Home Loans',
    copy: 'Looking to buy a new home or refinance? We’ve got options for you.',
    cue: 'Prepare your payment range and questions before an application or appointment.',
  },
  {
    icon: BadgeDollarSign,
    name: 'Credit Cards',
    copy: 'Find the right credit card.',
    cue: 'Compare fees, rewards, and how you expect to use the account—not rewards alone.',
  },
  {
    icon: Building2,
    name: 'Business Offerings',
    copy: 'Explore our business product offerings.',
    cue: 'Start from cash flow, payment volume, and borrowing need so the product list stays relevant.',
  },
]

const comparePaths = [
  {
    number: '01',
    label: 'Everyday access',
    title: 'Checking first',
    detail: 'For spending, direct deposit, bill pay, and everyday transactions.',
    tradeoff: 'Review ongoing fees and qualifying requirements after any introductory bonus.',
  },
  {
    number: '02',
    label: 'Flexible growth',
    title: 'Money Market',
    detail: 'For savings that should keep some access while earning interest.',
    tradeoff: 'Rates and withdrawal conditions can change the real fit.',
  },
  {
    number: '03',
    label: 'Predictable growth',
    title: 'Certificate of Deposit',
    detail: 'For funds you can set aside for a defined term at a fixed rate.',
    tradeoff: 'Early withdrawal can carry penalties; timing matters.',
  },
]

function inferGoal(value: string): GoalKey {
  const normalized = value.toLowerCase()
  if (/routing|aba|direct deposit/.test(normalized)) return 'routing'
  if (/save|saving|cd|rate|grow/.test(normalized)) return 'saving'
  if (/home|mortgage|equity|refinance/.test(normalized)) return 'home'
  return 'checking'
}

function App() {
  const [answerKey, setAnswerKey] = useState<GoalKey>('checking')
  const [query, setQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [memoryClearWarning, setMemoryClearWarning] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<'login' | 'appointment' | null>(null)
  const [memory, setMemory] = useState(loadCustomerMemory)
  const [cue, setCue] = useState<AgentCue | null>(null)
  const answerRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const memoryButtonRef = useRef<HTMLButtonElement>(null)
  const cueTimerRef = useRef<number | null>(null)
  const skipNextMemorySaveRef = useRef(false)

  const currentAnswer = answers[answerKey]
  const currentEvidence = [
    ...currentAnswer.evidence,
    ...(answerKey === 'checking' && memory.enabled && memory.priorities.includes('Clear monthly cost')
      ? ['Your saved priority: keep monthly costs easy to understand']
      : []),
  ]
  const contextSummary = useMemo(() => memory.enabled && memory.priorities.length ? memory.priorities.join(' · ') : 'Saved memory is not in use', [memory])
  const firstName = memory.customerName.trim().split(/\s+/)[0] || 'this customer'
  const closeMemory = useCallback(() => setMemoryOpen(false), [])

  useEffect(() => {
    if (skipNextMemorySaveRef.current) {
      skipNextMemorySaveRef.current = false
      return
    }
    saveCustomerMemory(memory)
  }, [memory])

  useEffect(() => () => {
    if (cueTimerRef.current) window.clearTimeout(cueTimerRef.current)
  }, [])

  useEffect(() => {
    if (!modal) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null)
      if (event.key === 'Tab' && modalRef.current) {
        const controls = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute('disabled'))
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
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      returnFocusRef.current?.focus()
    }
  }, [modal])

  const revealAnswer = (key: GoalKey) => {
    setAnswerKey(key)
    window.setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
  }

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault()
    revealAnswer(inferGoal(query))
  }

  const openModal = (kind: 'login' | 'appointment', trigger: HTMLElement) => {
    returnFocusRef.current = trigger
    setModal(kind)
  }

  const showCue = (text: string, event?: MouseEvent<HTMLElement>) => {
    if (cueTimerRef.current) window.clearTimeout(cueTimerRef.current)
    let anchor: AgentCue['anchor']
    if (event?.detail === 0) {
      const rect = event.currentTarget.getBoundingClientRect()
      anchor = { x: Math.min(rect.right + 16, window.innerWidth - 330), y: Math.min(rect.top + rect.height / 2, window.innerHeight - 150) }
    }
    setCue({ id: Date.now(), text, anchor })
    cueTimerRef.current = window.setTimeout(() => setCue(null), 4000)
  }

  const productCue = (name: string, genericCue: string) => {
    if (!memory.enabled) return genericCue
    const namePrefix = memory.customerName.trim() ? `${firstName}'s` : 'Your'
    if (name === 'Checking' && memory.priorities.includes('Clear monthly cost')) return `${namePrefix} preference for clear monthly costs makes ongoing requirements more important than the bonus.`
    if (name === 'Money Market' && /\b(access|accessible|liquid|withdraw)\b/i.test(memory.goal)) return `${namePrefix} stated goal mentions access, so flexibility belongs in the comparison.`
    if (name === 'CDs' && /\b\d+\s*[- ]?\s*(?:months?|years?)\b/i.test(memory.goal)) return `${namePrefix} stated time horizon makes a fixed term relevant—only for money that can stay put.`
    if (name === 'Home Loans') return 'Memory can prepare questions, but it is blocked from predicting eligibility or pricing.'
    return genericCue
  }

  const handleClearMemory = () => {
    const result = clearCustomerMemory()
    skipNextMemorySaveRef.current = true
    setMemoryClearWarning(result.persistence === 'unavailable')
    setMemory(result.memory)
  }

  const handleRestoreMemory = () => {
    setMemoryClearWarning(false)
    setMemory(restoreCustomerMemory())
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to main content</a>
      <div className="concept-banner">
        <span>Independent AI-native homepage concept</span>
        <strong>No account access · No application submitted · No live AI</strong>
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Atlantic Union Bank concept home">
          <img src="./aub-logo.png" alt="Atlantic Union Bank" />
        </a>
        <nav className={menuOpen ? 'nav nav--open' : 'nav'} aria-label="Primary navigation">
          <a href="#products" onClick={() => setMenuOpen(false)}>Personal</a>
          <a href="#products" onClick={() => setMenuOpen(false)}>Business</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>Commercial</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>Wealth</a>
          <a href="#insights" onClick={() => setMenuOpen(false)}>Insights & Stories</a>
        </nav>
        <div className="header-actions">
          <a className="routing" href="#contact">Routing #: 051403164</a>
          <button ref={memoryButtonRef} className={memory.enabled ? 'memory-button memory-button--on' : 'memory-button'} onClick={() => setMemoryOpen(true)} aria-haspopup="dialog" aria-label={`Memory ${memory.enabled ? 'on' : 'off'}`}><Brain size={17} /><span>Memory {memory.enabled ? 'on' : 'off'}</span></button>
          <button className="header-icon" aria-label="Search this concept" onClick={() => document.getElementById('guide-input')?.focus()}><Search size={18} /></button>
          <button className="login-button" onClick={(event) => openModal('login', event.currentTarget)}><UserRound size={17} /> Login</button>
          <button className="menu-button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-image" aria-hidden="true" />
          <div className="hero-wash" />
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="eyebrow eyebrow--light">Better banking, made personal</span>
            <h1 id="hero-title">Earn up to an <em>$800 cash bonus*</em></h1>
            <p>Open a new personal checking account and you could be eligible when you meet qualifying activities.</p>
            <a className="primary-button primary-button--light" href="#compare" onClick={(event) => showCue('I can explain the offer, but I will keep ongoing fees and requirements visible.', event)}>Explore the offer <ArrowRight size={18} /></a>
          </motion.div>

          <motion.div className="guide" initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.55 }}>
            <div className="guide-heading">
              <span><Sparkles size={17} /> AUB Guide</span>
              <button className="context-button" onClick={() => setMemoryOpen(true)} aria-haspopup="dialog"><Brain size={15} /> What I remember</button>
            </div>
            <h2>What can we help you with today?</h2>
            <p className="guide-intro">Ask in your own words. The guide will explain options and show its reasoning; you decide what happens next.</p>
            <form className="guide-form" onSubmit={submitQuestion}>
              <label className="sr-only" htmlFor="guide-input">Ask Atlantic Union Bank Guide</label>
              <input id="guide-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “Which savings option fits a 12-month goal?”" />
              <button type="submit" aria-label="Ask the guide"><ArrowRight /></button>
            </form>
            <div className="prompt-row" aria-label="Suggested questions">
              {promptMap.map((prompt) => <button key={prompt.key} onClick={() => revealAnswer(prompt.key)}>{prompt.label}</button>)}
            </div>
            <button className="memory-disclosure" onClick={() => setMemoryOpen(true)}><span className={memory.enabled ? 'memory-dot memory-dot--on' : 'memory-dot'} />{memory.enabled ? `Using fictional profile for ${firstName}` : 'Customer memory is paused'}<span>Inspect or edit</span></button>
          </motion.div>
        </section>

        <motion.section className="guide-answer" ref={answerRef} aria-live="polite" key={answerKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="answer-mark"><Sparkles size={21} /></div>
          <div className="answer-copy">
            <span className="eyebrow">{currentAnswer.eyebrow}</span>
            <h2>{currentAnswer.title}</h2>
            <p>{currentAnswer.body}</p>
            <a className="text-link" href={currentAnswer.target}>{currentAnswer.action} <ArrowRight size={16} /></a>
          </div>
          <details className="evidence">
            <summary>Why this answer</summary>
            <ul>{currentEvidence.map((item) => <li key={item}><Check size={15} /> {item}</li>)}</ul>
            <p>Guidance is illustrative, not financial advice or an eligibility decision.</p>
          </details>
        </motion.section>

        <section className="products" id="products" aria-labelledby="products-title">
          <div className="section-heading">
            <div><span className="eyebrow">Bank around your life</span><h2 id="products-title">Start with what you need to do.</h2></div>
            <p>Select a path and the guide will connect one useful tradeoff—without hiding the rest of the bank.</p>
          </div>
          <div className="product-list">
            {products.map((product, index) => {
              const Icon = product.icon
              const selected = selectedProduct === product.name
              return (
                <motion.button key={product.name} className={selected ? 'product-row product-row--selected' : 'product-row'} onClick={(event) => { setSelectedProduct(selected ? null : product.name); showCue(productCue(product.name, product.cue), event) }} aria-pressed={selected} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (index % 3) * 0.05 }}>
                  <span className="product-index">0{index + 1}</span>
                  <Icon className="product-icon" />
                  <span className="product-name"><strong>{product.name}</strong><small>{product.copy}</small></span>
                  <span className="product-cue">{selected ? product.cue : 'Explore'}</span>
                  <ArrowRight className="product-arrow" />
                </motion.button>
              )
            })}
          </div>
        </section>

        <section className="compare" id="compare" aria-labelledby="compare-title">
          <div className="compare-heading"><span className="eyebrow eyebrow--light">Three useful directions</span><h2 id="compare-title">Choose the shape of the decision first.</h2><p>The guide narrows the starting point. Current rates, terms, disclosures, and a human conversation still decide the fit.</p></div>
          <div className="compare-grid">
            {comparePaths.map((path) => (
              <article key={path.number}>
                <span className="compare-number">{path.number}</span>
                <span className="compare-label">{path.label}</span>
                <h3>{path.title}</h3>
                <p>{path.detail}</p>
                <div><strong>Keep in view</strong><span>{path.tradeoff}</span></div>
                <button onClick={(event) => { setSelectedProduct(path.title); showCue(memory.enabled ? `I’ll remember this direction for ${firstName}, while keeping the tradeoff visible.` : path.tradeoff, event) }}>{selectedProduct === path.title ? <><Check /> Selected to discuss</> : <>Choose this direction <ArrowRight /></>}</button>
              </article>
            ))}
          </div>
        </section>

        <section className="story" id="story" aria-labelledby="story-title">
          <div className="story-media"><img src="./community-banking.webp" alt="A customer working from a home office" /></div>
          <div className="story-copy">
            <span className="eyebrow">Better banking starts here</span>
            <h2 id="story-title">Honest advice should leave you more certain—not more dependent.</h2>
            <p>We believe people have a right to expect more from the companies they do business with—and they can expect more from Atlantic Union Bank, a bank whose Virginia roots go back to 1902.</p>
            <p>By offering fair financial solutions and honest advice, we create opportunities for families and business owners.</p>
            <a className="text-link" href="#contact">Learn more about AUB <ArrowRight size={16} /></a>
          </div>
        </section>

        <section className="insights" id="insights" aria-labelledby="insights-title">
          <div className="section-heading"><div><span className="eyebrow">Featured educational articles</span><h2 id="insights-title">Learn before you act.</h2></div><p>The guide can point to relevant education, but the source stays visible.</p></div>
          <div className="article-list">
            <a href="#insights" onClick={(event) => showCue('This is educational context. I won’t treat reading it as a financial decision.', event)}><span>Your security · 08.24.2026</span><strong>Protecting Your Financial Life in a Digital World</strong><ArrowRight /></a>
            <a href="#insights" onClick={(event) => showCue('I can connect education to a goal without inferring intent or eligibility.', event)}><span>Your life · 08.10.2026</span><strong>Types of Mortgages</strong><ArrowRight /></a>
            <a href="#insights" onClick={(event) => showCue('Security guidance stays general; this demo never sees accounts or transactions.', event)}><span>Your business · Your security · 08.03.2026</span><strong>Protecting Your Business from Wire and Payment Fraud</strong><ArrowRight /></a>
          </div>
        </section>

        <section className="appointment" id="appointment">
          <div><CalendarDays /><span className="eyebrow">Schedule an appointment</span><h2>You can even open an account by video.</h2><p>The guide can prepare your questions; a banker handles the real conversation and any application.</p></div>
          <button className="primary-button" onClick={(event) => { showCue(`I can carry ${memory.enabled ? `${firstName}'s stated goal` : 'your stated goal'} into a question list—not into an application.`, event); openModal('appointment', event.currentTarget) }}>Prepare my appointment <ArrowRight /></button>
        </section>
      </main>

      <footer id="contact">
        <div className="footer-brand"><img src="./aub-logo.png" alt="Atlantic Union Bank" /><p>Atlantic Union Bank, located in Virginia and beyond, offers checking accounts, savings accounts, business loans and more.</p><span><ShieldCheck /> Member FDIC · Equal Housing Lender</span></div>
        <div><h2>Quick Links</h2><a href="#products">Rates</a><a href="#insights">Insights & Stories</a><a href="#contact">Security & Fraud Center</a><a href="#contact">Accessibility</a></div>
        <div><h2>Contact Us</h2><a href="tel:8009904828">Customer Care: 800-990-4828</a><p>Mon–Fri: 7am–8pm ET<br />Sat: 7am–5pm ET</p><p>Routing number: 051403164<br />NMLS number: 551889</p></div>
        <p className="footer-note">Independent concept for demonstration only. Not affiliated with or endorsed by Atlantic Union Bank. © 2026 Atlantic Union Bank copy and marks belong to their respective owner.</p>
      </footer>

      <AnimatePresence>
        {modal && (
          <div className="modal-layer" role="presentation">
            <motion.button className="modal-scrim" aria-label="Close dialog" onClick={() => setModal(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.section ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}>
              <button ref={closeRef} className="modal-close" aria-label="Close dialog" onClick={() => setModal(null)}><X /></button>
              {modal === 'login' ? <>
                <Landmark />
                <span className="eyebrow">Simulation boundary</span>
                <h2 id="modal-title">Online banking is not connected.</h2>
                <p>This concept does not collect credentials or access accounts. Use the real Atlantic Union Bank website for secure online banking.</p>
                <button className="primary-button" onClick={() => setModal(null)}>Return to concept</button>
              </> : <>
                <MessageCircleQuestion />
                <span className="eyebrow">Prepared for a human conversation</span>
                <h2 id="modal-title">Bring the decision, not just a product name.</h2>
                <ul><li>Your goal and timing</li><li>{contextSummary}</li><li>Questions about fees, terms, access, and eligibility</li></ul>
                <p>No appointment was scheduled. This is a local demonstration.</p>
                <button className="primary-button" onClick={() => setModal(null)}>Done</button>
              </>}
            </motion.section>
          </div>
        )}
      </AnimatePresence>
      <MemoryPanel open={memoryOpen} memory={memory} onClose={closeMemory} onChange={setMemory} onClear={handleClearMemory} onRestore={handleRestoreMemory} clearWarning={memoryClearWarning} returnFocusRef={memoryButtonRef} />
      <AmbientGuide cue={cue} />
    </div>
  )
}

export default App
