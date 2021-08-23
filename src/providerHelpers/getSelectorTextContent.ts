import type { Page } from 'puppeteer'

export async function getSelectorTextContent(page: Page, selector: string) {
  return page.$eval(selector, element => {
    return element ? element.textContent?.trim() : ''
  })
}
