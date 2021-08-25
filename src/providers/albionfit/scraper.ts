import { debug } from 'console'
import { DESCRIPTION_PLACEMENT } from '../../interfaces/outputProduct'
import { getProductOptions } from '../shopify/helpers'
import shopifyScraper, { TShopifyExtraData } from '../shopify/scraper'

export default shopifyScraper(
  {
    productFn: async (_request, page) => {
      const extraData: TShopifyExtraData = {}

      /**
       * Get additional descriptions and information
       */

      /**
       * Get bullets of the page
       */
      await page.waitForTimeout(8000)

      const bulletsNew = await page.evaluate(() => {
        let bulletItems = Array.from(document.querySelectorAll('.description ul li'))
        return bulletItems.map(e => e.textContent?.trim() || '')
      })

      if (bulletsNew.length) {
        extraData.bullets = [...bulletsNew]
      }
      /**
       * Get additional descriptions
       */
      extraData.additionalSections = []
      // Main description
      let description = await page.evaluate(() => {
        return document.querySelector('.description p')?.outerHTML
      })

      if (!description) {
        description = await page.evaluate(() => {
          return document.querySelector('.description div')?.outerHTML
        })
      }

      if (description && extraData.additionalSections) {
        extraData.additionalSections.push({
          name: 'Description',
          content: description,
          description_placement: DESCRIPTION_PLACEMENT.MAIN,
        })
      }

      const adjacentDescription = await page.evaluate(() => {
        const container = document.createElement('div')
        // bullets document.querySelector('.description ul')
        let list = document.querySelector('.description ul')
        // parraphs Array.from(document.querySelectorAll('.description p'))
        let listExtra = Array.from(document.querySelectorAll('.description p'))
        listExtra.shift()
        console.log('list extra', listExtra)
        if (listExtra.length <= 0) {
          listExtra = Array.from(document.querySelectorAll('.description > span'))
        }

        if (list) {
          container.append(list, ...listExtra)
        } else {
          container.append(...listExtra)
        }

        if (container.outerHTML == '<div></div>') return

        return container.outerHTML
      })

      if (adjacentDescription && extraData.additionalSections) {
        extraData.additionalSections.push({
          name: 'Description',
          content: adjacentDescription,
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        })
      }

      /**
       * Get Size Chart HTML
       */

      return extraData
    },
    variantFn: async (
      _request,
      page,
      product,
      providerProduct,
      providerVariant,
      _extraData: TShopifyExtraData,
    ) => {
      /**
       * Get the list of options for the variants of this provider
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant)

      if (optionsObj.Size) {
        product.size = optionsObj.Size
      }
      const color = await page.evaluate(() => {
        return (
          document
            .querySelector('.swatch-label .swatch-variant-name')
            ?.textContent?.replace(/-/gm, '')
            .trim() || ''
        )
      })

      if (color) {
        product.color = color
      }

      /**
       * Sometimes, the title needs a replacement to remove the color at the end (if exists)
       * Example: "High-Waist Catch The Light Short - Black"
       */
      // product.title = product.title.replace(/,.*/gm, '')
    },
  },
  {},
)
