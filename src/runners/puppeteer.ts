import puppeteer from 'puppeteer'

import type { Browser } from 'puppeteer'
import { unknownError } from '../errors'
import IProvider from '../interfaces/provider'
import IReport from '../interfaces/report'
import IScrapeRequest from '../interfaces/request'
import { IRunner } from '../interfaces/runner'

const { HEADLESS = false, DEVTOOLS = false } = process.env

const getPuppeteer = async (): Promise<Browser> => {
  const opts = {
    headless: !!HEADLESS,
    devtools: !!DEVTOOLS,
  }
  console.log(`Running with options: ${JSON.stringify(opts)}`)
  return puppeteer.launch(opts)
}

// cache browser as singleton to prevent relaunching
let browser: Browser

const getBrowser = async () => {
  if (!browser) {
    browser = await getPuppeteer()
  }
  return browser
}

const puppeteerRunner: IRunner = async (
  provider: IProvider,
  request: IScrapeRequest,
): Promise<IReport> => {
  console.info(`🕑 [${provider.name}] Running provider...`)

  const browser = await getBrowser()
  const page = await browser.newPage()
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  })

  try {
    return await provider.scraper(request, page)
  } catch (e) {
    console.error(e)
    return unknownError(e as Error)
  } finally {
    await page.close()
  }
}

export default puppeteerRunner
