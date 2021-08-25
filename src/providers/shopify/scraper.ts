import Product from '../../entities/product'
import { IScraperConstructor } from '../../interfaces/scraper'
import screenPage from '../../utils/capture'
import { extractMetaTags } from '../../utils/extractors'
import { getProductJson, getProductOptions, getShopifyImages, getShopifyVideos } from './helpers'
import parseHtmlTextContent, { htmlToTextArray } from '../../providerHelpers/parseHtmlTextContent'
import IScrapeRequest from '../../interfaces/request'
import type { Page } from 'puppeteer'
import { TShopifyProduct, TShopifyProductVariant } from './types'
import { DESCRIPTION_PLACEMENT, IDescriptionSection } from '../../interfaces/outputProduct'

type TCallbacks<T = { [key: string]: any }> = {
  // Callbacks for the scrapper
  productFn?: (request: IScrapeRequest, page: Page, providerProduct: TShopifyProduct) => Promise<T>
  variantFn?: (
    request: IScrapeRequest,
    page: Page,
    product: Product,
    providerProduct: TShopifyProduct,
    providerVariant: TShopifyProductVariant,
    extraData: T,
  ) => Promise<void>
}

export type TShopifyExtraData = {
  breadcrumbs?: string[]
  bullets?: Product['bullets']
  keyValuePairs?: { [key: string]: string }
  additionalSections?: IDescriptionSection[]
  sizeChartHtml?: string
  sizeChartUrls?: string[]
  videos?: string[]
  images?: string[]
  metadata?: { [key: string]: unknown }
  imagesMap?: { variants: string[]; imageSrc: string }[]
}

const shopifyScraper: IScraperConstructor<TCallbacks, { currency?: string }> =
  ({ productFn, variantFn }, { currency = 'USD' }) =>
  async (request, page) => {
    console.log('scraping', request)
    // Get the product data from the Shopify website
    const providerProduct = await getProductJson(page, request.pageUrl)

    // Navigate to the regular
    await page.goto(request.pageUrl)

    // Extract all the metaTags
    const metaTags = await extractMetaTags(page)

    // Take a screenshot of the website
    const screenshot = await screenPage(page)

    // Get data from the product page that can be used later in the variants
    let productExtractedData: TShopifyExtraData = {}
    if (typeof productFn === 'function') {
      productExtractedData = await productFn(request, page, providerProduct)
    }

    // Iterate over the variants
    const products: Product[] = []
    for (const providerVariant of providerProduct.variants) {
      const title = providerProduct.title

      const product = new Product(
        providerVariant.id.toString(),
        title,
        `${request.pageUrl.replace(/\?.*/gim, '')}?variant=${providerVariant.id}`,
      )

      product.itemGroupId = providerProduct.id.toString()
      product.sku = providerVariant.sku
      product.brand = providerProduct.vendor
      product.images = getShopifyImages(providerProduct)
      product.videos = getShopifyVideos(providerProduct)
      product.realPrice = providerVariant.price / 100

      // Add all the options a product might have (if they exists)
      product.options = getProductOptions(providerProduct, providerVariant)

      if (providerVariant.compare_at_price) {
        product.higherPrice = providerVariant.compare_at_price / 100
      }
      product.availability = providerVariant.available
      product.currency = currency

      /**
       * Add the description as mainDescription additionalSection
       */
      // if (providerProduct.description) {
      //   product.addAdditionalSection({
      //     name: 'Description',
      //     content: providerProduct.description,
      //     description_placement: DESCRIPTION_PLACEMENT.MAIN,
      //   })
      // }

      /**
       * Add other sections obtained in the productFn
       */
      if (productExtractedData.additionalSections) {
        productExtractedData.additionalSections.forEach(s => {
          product.addAdditionalSection({
            name: s.name,
            content: s.content,
            description_placement: s.description_placement,
          })
        })
      }

      /**
       * Add bullets obtained in the productFn (and remove empty strings)
       */
      if (Array.isArray(productExtractedData.bullets)) {
        product.bullets = productExtractedData.bullets.filter(e => e !== '')
      }

      /**
       * Set the properties obtained in the "productFn" callback
       */
      // Breadcrumbs
      if (productExtractedData.breadcrumbs) {
        product.breadcrumbs = productExtractedData.breadcrumbs
      }

      // KeyValue Pairs
      if (productExtractedData.keyValuePairs) {
        product.keyValuePairs = productExtractedData.keyValuePairs
      }

      // The HTML of the Size Chart
      if (productExtractedData.sizeChartHtml) {
        product.sizeChartHtml = productExtractedData.sizeChartHtml
      }

      // Any images
      if (productExtractedData.images) {
        product.images = [...product.images, ...productExtractedData.images]
      }

      // Any videos
      if (productExtractedData.videos) {
        product.videos = [...product.videos, ...productExtractedData.videos]
      }

      /**
       * TODO: Add a processing to the description HTML to extract bullets and keyValues automatically
       */

      /**
       * General metadata
       */
      product.metadata = {
        ...productExtractedData.metadata,
        providerProduct,
        metaTags,
      }

      // Execute a callback fn for each variant to complete more data. Also pass the results extracted in the productFn callback
      if (typeof variantFn === 'function') {
        await variantFn(
          request,
          page,
          product,
          providerProduct,
          providerVariant,
          productExtractedData,
        )
      }

      /**
       * Parse the MAIN description to HTML
       */
      const mainDescription = product.additionalSections.find(
        e => e.description_placement === DESCRIPTION_PLACEMENT.MAIN,
      )
      if (mainDescription) {
        product.description = parseHtmlTextContent(mainDescription?.content)
      }

      /**
       * Try to extract videos from the additionalSections
       * Notes:
       *  - It only extract YouTube URLs.
       *  - TODO: We need to parse the obtained URLs and normalize them in YouTube format
       */
      const youtubeRegex =
        /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*?[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/gi
      const extractedVideos = product.additionalSections
        .map(s => s.content.replace(/\"|<|>/gim, '').match(youtubeRegex) || [])
        .flat()
      product.videos = [...new Set([...product.videos, ...extractedVideos])] // Remove duplicates

      /**
       * Remove image duplicates
       */
      product.images = [...new Set(product.images)]

      /**
       * Try to extract bullets from the additionalSections and remove duplicates
       */
      product.bullets = [
        ...new Set([
          ...(product.bullets || []),
          // ...product.additionalSections.map(section => htmlToTextArray(section.content)).flat(),
        ]),
      ]

      products.push(product)
    }

    return {
      screenshot,
      products,
    }
  }

export const scraper = shopifyScraper({}, {})

export default shopifyScraper
