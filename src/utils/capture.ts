import type { Page } from 'puppeteer'

export default async function screenPage(page: Page): Promise<string> {
  await page.screenshot()
  // upload shot to s3
  // return s3 url
  return ''
}
