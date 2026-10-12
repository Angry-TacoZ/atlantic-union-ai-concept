import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('guide, selection, and simulation boundary work', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Earn up to an \$800 cash bonus/i })).toBeVisible()
  const activate = async (locator: ReturnType<typeof page.getByRole>) => testInfo.project.name === 'mobile' ? locator.tap() : locator.click()
  await activate(page.getByRole('button', { name: /Grow savings predictably/i }))
  await expect(page.getByRole('heading', { name: /CD may deserve the first look/i })).toBeVisible()
  const checking = page.locator('.product-row').first()
  await checking.scrollIntoViewIfNeeded()
  if (testInfo.project.name === 'mobile') await checking.tap()
  else await checking.click()
  await expect(checking).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('status')).toContainText("Maya's preference for clear monthly costs")
  await expect(page.getByRole('status')).toHaveCount(0, { timeout: 5200 })
  await activate(page.getByRole('button', { name: /Login/i }))
  await expect(page.getByRole('dialog')).toContainText('Online banking is not connected')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test('has no serious or critical automated accessibility violations', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(700)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')).toEqual([])
})

test('keyboard can reach the guide and complete the primary answer flow', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: /Skip to main/i })).toBeFocused()
  await page.getByLabel('Ask Atlantic Union Bank Guide').focus()
  await page.keyboard.type('What is the routing number?')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: /routing number is 051403164/i })).toBeVisible()

  const memoryButton = page.getByRole('button', { name: /Memory on/i })
  await memoryButton.focus()
  await page.keyboard.press('Enter')
  const memoryDialog = page.getByRole('dialog', { name: /What the guide knows/i })
  await expect(memoryDialog).toBeVisible()
  await expect(page.getByRole('button', { name: /Close customer memory/i })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: /Clear everything/i })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(memoryDialog).toHaveCount(0)
  await expect(memoryButton).toBeFocused()
})

test('customer can edit, pause, clear, and restore browser-local memory', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Memory on/i }).click()
  const name = page.getByRole('textbox', { name: /Preferred name/i })
  await name.fill('Jordan Lee')
  await page.getByRole('button', { name: /Close customer memory/i }).click()
  await page.reload()
  await page.getByRole('button', { name: /Memory on/i }).click()
  await expect(page.getByRole('textbox', { name: /Preferred name/i })).toHaveValue('Jordan Lee')
  await page.getByRole('checkbox', { name: /Use this memory/i }).uncheck()
  await page.getByRole('button', { name: /Clear everything/i }).click()
  await expect(page.getByRole('textbox', { name: /Preferred name/i })).toHaveValue('')
  await page.getByRole('button', { name: /Restore demo profile/i }).click()
  await expect(page.getByRole('textbox', { name: /Preferred name/i })).toHaveValue('Maya Carter')
})

test('product guidance stops attributing goals and priorities after they are edited', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Memory on/i }).click()
  await page.getByRole('textbox', { name: /Current goal/i }).fill('Keep funds accessible tomorrow; no fixed term.')
  await page.getByRole('checkbox', { name: /Clear monthly cost/i }).uncheck()
  await page.getByRole('button', { name: /Close customer memory/i }).click()

  const cds = page.locator('.product-row').filter({ hasText: 'CDs' })
  await cds.scrollIntoViewIfNeeded()
  await cds.click()
  let status = page.getByRole('status').last()
  await expect(status).toContainText('A fixed-rate direction when timing is known')
  await expect(status).not.toContainText(/12-month goal|Keep funds accessible tomorrow/)

  const checking = page.locator('.product-row').filter({ hasText: 'Checking' })
  await checking.scrollIntoViewIfNeeded()
  await checking.click()
  status = page.getByRole('status').last()
  await expect(status).toContainText('Best place to begin when everyday access')
  await expect(status).not.toContainText(/preference for clear monthly costs/)
})

test('keyboard product activation keeps the guide beside the selected product', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const product = page.locator('.product-row').first()
  await product.scrollIntoViewIfNeeded()
  const productBox = await product.boundingBox()
  expect(productBox).not.toBeNull()

  await product.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toBeVisible()
  await page.waitForTimeout(500)
  const guideBox = await page.getByRole('status').boundingBox()
  expect(guideBox).not.toBeNull()
  expect(guideBox!.y).toBeGreaterThan(productBox!.y + productBox!.height / 2 - 12)
  expect(guideBox!.y).toBeLessThan(productBox!.y + productBox!.height / 2 + 12)
})

test('clear everything resets the visible profile when browser storage is denied', async ({ page }) => {
  const profile = {
    version: 1,
    enabled: true,
    acknowledged: true,
    customerName: 'Maya Carter',
    relationshipSince: '2018',
    region: 'Richmond, Virginia area',
    goal: 'Build a 12-month emergency reserve while keeping part of it easy to access.',
    preferredChannel: 'Digital first, with a banker for important decisions',
    priorities: ['Clear monthly cost', 'Virginia branch access', 'Predictable growth'],
  }
  await page.addInitScript(({ key, savedProfile }) => {
    const setItem = Storage.prototype.setItem
    setItem.call(localStorage, key, JSON.stringify(savedProfile))
    Storage.prototype.removeItem = () => { throw new DOMException('denied', 'SecurityError') }
    Storage.prototype.setItem = () => { throw new DOMException('denied', 'SecurityError') }
  }, { key: 'aub-customer-memory-v1', savedProfile: profile })
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/')
  await page.getByRole('button', { name: /Memory on/i }).click()
  await page.getByRole('button', { name: /Clear everything/i }).click()

  await expect(page.getByRole('textbox', { name: /Preferred name/i })).toHaveValue('')
  await expect(page.getByRole('checkbox', { name: /Use this memory/i })).not.toBeChecked()
  await expect(page.getByRole('alert')).toContainText(/could not remove the saved data/i)
  expect(pageErrors).toEqual([])
})
