import '@testing-library/jest-dom/vitest'

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = [0]
  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] { return [] }
  unobserve() {}
}

globalThis.IntersectionObserver = IntersectionObserverMock
Element.prototype.scrollIntoView = () => undefined
window.scrollTo = () => undefined
