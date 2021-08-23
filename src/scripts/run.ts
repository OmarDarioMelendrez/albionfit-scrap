import format from 'dateformat'
import { load } from 'js-yaml'
import { readFile, writeFile } from 'fs/promises'
import { chunk } from 'lodash'
import { join } from 'path'
import * as pretty from 'prettier'
import { makeContext, makeMessage } from './utils'
import handler from '../handlers'
import type IOutputProduct from '../interfaces/outputProduct'

interface URL {
  [provider: string]: string[]
}

async function run() {
  const date = format(new Date(), 'yyyy-mm-dd_HH-MM.ss')
  const content: string = await readFile(join(__dirname, '../../run/urls.yml'), {
    encoding: 'utf-8',
  })
  const entries = load(content) as URL
  for (const [provider, urls] of Object.entries(entries).filter(([p]) => !p.startsWith('.'))) {
    const sheet = `${provider} ${date}`
    let batchCount = 0
    let productCount = 0
    console.log(`[${provider}] ${urls.length} urls`)
    const batches = chunk(urls, 100)
    for await (const batch of batches) {
      batchCount++
      const name = `${provider}-${date}-batch${batchCount}`
      const reports: IOutputProduct[][] = []
      for await (const pageUrl of batch) {
        productCount++
        console.log(
          `[${provider}] url ${productCount}/${batch.length} of batch ${batchCount}/${batches.length}`,
        )
        const report = await handler(
          // @ts-ignore
          makeMessage({ extractors: [provider], pageUrl }),
          makeContext(),
        )
        // @ts-ignore
        const products: IOutputProduct[] = report
          .flat()
          .flatMap(extractor => extractor.extractorResults)
          .flatMap(result => result.products || [])
          .map(product => ({ ...product, metadata: {} }))
        reports.push(products)
      }
      await writeFile(
        join(__dirname, `../../run/${name}.json`),
        pretty.format(JSON.stringify(reports), { parser: 'json' }),
      )
    }
  }
}

run()
  .then((result: any) => console.log(result))
  .catch((error: Error) => console.error(error))
  .finally(() => process.exit())
