import type { Context, SQSEvent } from 'aws-lambda'
import IOutputProduct from '../interfaces/outputProduct'
import IReport from '../interfaces/report'
import IScrapeRequest from '../interfaces/request'
import IScrapeResponse from '../interfaces/response'
import { getProvider } from '../providers'
import puppeteerRunner from '../runners/puppeteer'

async function handleExtractor(
  request: IScrapeRequest,
  extractor: string,
): Promise<IReport<IOutputProduct>> {
  const provider = getProvider(extractor)
  const report = await puppeteerRunner(provider, request)
  return {
    ...report,
    products: report.products?.map(p => p.toJson()),
  }
}

async function handleRequest(request: IScrapeRequest): Promise<IScrapeResponse> {
  const { pageUrl, extractors } = request

  const extractorResults = await Promise.all(
    extractors.map(extractor => handleExtractor(request, extractor)),
  )
  return {
    pageUrl,
    extractorResults,
  }
}

export default async (event: SQSEvent, _context: Context) => {
  const processors = event.Records.map(async message => {
    const request = JSON.parse(message.body) as IScrapeRequest
    return handleRequest(request)
  })
  return Promise.all(processors).catch(e => {
    if (e.code === 'ENOSPC') {
      // out of space, kill process to force lambda to abandon this worker
      process.exit(1)
    }
    throw e
  })
}
