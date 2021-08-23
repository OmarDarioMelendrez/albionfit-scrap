/* eslint-disable camelcase */

export type TMediaVideo = {
  alt: null
  id: number
  position: number
  preview_image: {
    aspect_ratio: number
    height: number
    width: number
    src: string
  }
  aspect_ratio: number
  duration: number
  media_type: 'video' | 'external_video'
  sources: {
    format: string
    height: number
    mime_type: string
    url: string
    width: number
  }[]
  external_id?: string
  host?: 'youtube'
}

export type TMediaImage = {
  alt: string
  id: number
  position: number
  preview_image: {
    aspect_ratio: number
    height: number
    width: number
    src: string
  }
  aspect_ratio: number
  height: number
  media_type: 'image'
  src: string
  width: number
}

type TMedia = TMediaVideo | TMediaImage

export type TShopifyProductVariant = {
  id: number
  title: string
  option1: string
  option2: null
  option3: null
  sku: string
  requires_shipping: boolean
  taxable: boolean
  featured_image: {
    id: number
    product_id: number
    position: number
    created_at: Date
    updated_at: Date
    alt: string
    width: number
    height: number
    src: string
    variant_ids: number[]
  }
  available: boolean
  name: string
  public_title: string
  options: string[]
  price: number
  weight: number
  compare_at_price: number
  inventory_management: string
  barcode: string
  featured_media: {
    alt: string
    id: number
    position: number
    preview_image: {
      aspect_ratio: number
      height: number
      width: number
      src: string
    }
  }
  requires_selling_plan: boolean
  selling_plan_allocations: any[]
}
export type TVariantsOptionKeys = {
  name: string
  position: number
  values: string[]
}

export type TShopifyProduct = {
  id: number
  title: string
  handle: string
  description: string
  published_at: Date
  created_at: Date
  vendor: string
  type: string
  tags: string[]
  price: number
  price_min: number
  price_max: number
  available: boolean
  price_varies: boolean
  compare_at_price: number
  compare_at_price_min: number
  compare_at_price_max: number
  compare_at_price_varies: boolean
  variants: TShopifyProductVariant[]
  images: string[]
  featured_image: string
  options: TVariantsOptionKeys[]
  media: TMedia[]
  requires_selling_plan: boolean
  selling_plan_groups: any[]
  content: string
}
