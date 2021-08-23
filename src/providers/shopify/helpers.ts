import type { Page } from 'puppeteer'
import { makeKeyValuePairFromArrays } from '../../providerHelpers/makeKeyValuePairFromArrays'
import { TMediaImage, TMediaVideo, TShopifyProductVariant, TShopifyProduct } from './types'
import parseUrl from 'parse-url'
import IScrapeRequest from '../../interfaces/request'

export function getShopifyImages(product: TShopifyProduct) {
  return (product.media as TMediaImage[]).filter(e => e.media_type === 'image').map(e => e.src)
}

export function getShopifyVideos(product: TShopifyProduct) {
  const videos: string[] = []

  const media = product.media as TMediaVideo[]
  media
    .filter(e => ['video', 'external_video'].includes(e.media_type))
    .forEach(e => {
      switch (e.media_type) {
        case 'video':
          e.sources.forEach(v => {
            videos.push(v.url)
          })
          break
        case 'external_video':
          if (e.host !== 'youtube') {
            throw new Error(
              `Host "${e.host}" can not be handled. Please adapt the code to allow it as an option`,
            )
          } else {
            videos.push(`https://www.youtube.com/watch?v=${e.external_id}`)
          }
          break
      }
    })

  return videos
}

export function getProductOptions(product: TShopifyProduct, variant: TShopifyProductVariant) {
  return makeKeyValuePairFromArrays(
    product.options.map(o => o.name),
    variant.options,
  )
}

export const getProductJson = async (page: Page, productUrl: IScrapeRequest['pageUrl']) => {
  // Get the .js file with the raw product data
  const parsedUrl = parseUrl(productUrl)
  await page.goto(`${parsedUrl.protocol}://${parsedUrl.resource}${parsedUrl.pathname}.js`)

  const productData = await page.evaluate(() => {
    let productObj: TShopifyProduct | null = null
    const pre = document.querySelector('pre')

    if (pre && pre.textContent) {
      try {
        productObj = JSON.parse(pre.textContent.trim())
      } catch (e) {
        console.error(e)
      }
    }

    return productObj
  })
  if (!productData) {
    // TODO: Improve error handling for this cases
    throw new Error('Could not find product information for this url')
  }

  return productData
}
