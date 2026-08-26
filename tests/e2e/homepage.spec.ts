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
})
