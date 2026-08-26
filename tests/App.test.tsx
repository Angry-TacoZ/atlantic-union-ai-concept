import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import App from '../src/App'

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

  test('makes planning context inspectable and editable', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /What I’m using/i }))
    const growth = screen.getByRole('checkbox', { name: /Predictable growth/i })
    expect(growth).not.toBeChecked()
    await user.click(growth)
    expect(growth).toBeChecked()
    expect(localStorage.getItem('aub-concept-priorities')).toMatch(/Predictable growth/)
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
