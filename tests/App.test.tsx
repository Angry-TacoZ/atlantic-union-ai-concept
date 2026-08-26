import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import App from '../src/App'
import { MEMORY_KEY, loadCustomerMemory } from '../src/lib/memory'

describe('Atlantic Union AI-native concept', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  test('keeps recognizable Atlantic Union homepage copy and boundaries', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Earn up to an \$800 cash bonus/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Routing #: 051403164/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/No account access/i)).toBeVisible()
    expect(screen.getByRole('heading', { name: /What can we help you with today/i })).toBeInTheDocument()
  })

  test('answers a routing-number question with visible evidence', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Find the routing number/i }))
    expect(screen.getByRole('heading', { name: /routing number is 051403164/i })).toBeInTheDocument()
    await user.click(screen.getByText(/Why this answer/i))
    expect(screen.getByText(/shown in the current site header and footer/i)).toBeVisible()
  })

  test('makes fictional customer memory inspectable, editable, and persistent', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Memory on/i }))
    expect(screen.getByRole('dialog', { name: /What the guide knows/i })).toHaveTextContent(/Fictional demo profile/i)
    expect(screen.getByText(/Make credit, eligibility, pricing, or fraud decisions/i)).toBeVisible()
    const name = screen.getByRole('textbox', { name: /Preferred name/i })
    await user.clear(name)
    await user.type(name, 'Jordan Lee')
    await waitFor(() => expect(localStorage.getItem(MEMORY_KEY)).toMatch(/Jordan Lee/))
  })

  test('uses memory in a short ambient product explanation and can pause it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('Checking').closest('button')!)
    expect(screen.getByRole('status')).toHaveTextContent(/Maya's preference for clear monthly costs/i)
    await user.click(screen.getByRole('button', { name: /Memory on/i }))
    await user.click(screen.getByRole('checkbox', { name: /Use this memory/i }))
    await user.click(screen.getByRole('button', { name: /Close customer memory/i }))
    await user.click(screen.getByRole('button', { name: /Money Market/i }))
    expect(screen.getAllByRole('status').some((status) => /more flexible savings direction/i.test(status.textContent || ''))).toBe(true)
  })

  test('recovers from malformed stored memory', () => {
    localStorage.setItem(MEMORY_KEY, '{not-json')
    expect(loadCustomerMemory().customerName).toBe('Maya Carter')
    localStorage.setItem(MEMORY_KEY, JSON.stringify({ version: 1, enabled: true }))
    expect(loadCustomerMemory().goal).toMatch(/12-month emergency reserve/i)
  })

  test('blocks simulated login and collects no credentials', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Login/i }))
    expect(screen.getByRole('dialog')).toHaveTextContent(/Online banking is not connected/i)
    expect(screen.queryByRole('textbox', { name: /password/i })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
