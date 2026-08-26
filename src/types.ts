export interface CustomerMemory {
  version: 1
  enabled: boolean
  acknowledged: boolean
  customerName: string
  relationshipSince: string
  region: string
  goal: string
  preferredChannel: string
  priorities: string[]
}

export interface AgentCue {
  id: number
  text: string
  anchor?: { x: number; y: number }
}
