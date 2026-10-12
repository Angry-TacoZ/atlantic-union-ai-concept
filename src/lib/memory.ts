import { defaultCustomerMemory } from '../data/memory'
import type { CustomerMemory } from '../types'

export const MEMORY_KEY = 'aub-customer-memory-v1'

const boundedString = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length <= max

export const isCustomerMemory = (value: unknown): value is CustomerMemory => {
  if (!value || typeof value !== 'object') return false
  const memory = value as Partial<CustomerMemory>
  return (
    memory.version === 1 &&
    typeof memory.enabled === 'boolean' &&
    typeof memory.acknowledged === 'boolean' &&
    boundedString(memory.customerName, 80) &&
    boundedString(memory.relationshipSince, 20) &&
    boundedString(memory.region, 100) &&
    boundedString(memory.goal, 300) &&
    boundedString(memory.preferredChannel, 120) &&
    Array.isArray(memory.priorities) &&
    memory.priorities.length <= 6 &&
    memory.priorities.every((priority) => boundedString(priority, 80))
  )
}

export const restoreCustomerMemory = (): CustomerMemory => structuredClone(defaultCustomerMemory)

export const loadCustomerMemory = (): CustomerMemory => {
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    if (!raw) return restoreCustomerMemory()
    const parsed: unknown = JSON.parse(raw)
    return isCustomerMemory(parsed) ? parsed : restoreCustomerMemory()
  } catch {
    return restoreCustomerMemory()
  }
}

export const saveCustomerMemory = (memory: CustomerMemory): void => {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory))
  } catch {
    // Memory is an optional enhancement; guidance remains usable if storage is unavailable.
  }
}

export const clearCustomerMemory = (): { memory: CustomerMemory; persistence: 'removed' | 'reset' | 'unavailable' } => {
  const memory = { ...restoreCustomerMemory(), enabled: false, acknowledged: true, customerName: '', relationshipSince: '', region: '', goal: '', preferredChannel: '', priorities: [] }
  try {
    localStorage.removeItem(MEMORY_KEY)
    return { memory, persistence: 'removed' }
  } catch {
    try {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(memory))
      return { memory, persistence: 'reset' }
    } catch {
      return { memory, persistence: 'unavailable' }
    }
  }
}
