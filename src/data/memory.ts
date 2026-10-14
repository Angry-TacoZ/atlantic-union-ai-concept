import type { CustomerMemory } from '../types'

export const defaultCustomerMemory: CustomerMemory = {
  version: 1,
  enabled: true,
  acknowledged: false,
  customerName: 'Maya Carter',
  relationshipSince: '2018',
  region: 'Richmond, Virginia area',
  goal: 'Build a 12-month emergency reserve while keeping part of it easy to access.',
  preferredChannel: 'Digital first, with a banker for important decisions',
  priorities: ['Clear monthly cost', 'Virginia branch access', 'Predictable growth'],
}

export const memoryGovernance = {
  source: 'Fictional onboarding answers and customer edits',
  purpose: 'Explain product tradeoffs and prepare questions',
  retention: 'This browser only, until the customer clears it',
  never: [
    'Make credit, eligibility, pricing, or fraud decisions',
    'Store credentials, balances, transactions, or government IDs',
    'Infer sensitive financial facts that the customer did not provide',
    'Send this demo profile to Atlantic Union Bank or another service',
  ],
}
