import { Card, CardContent } from '@/components/ui/card'
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from '@/lib/actions/product.actions'

import SelectVariant from '@/components/shared/product/select-variant'
import ProductPrice from '@/components/shared/product/product-price'
import ProductGallery from '@/components/shared/product/product-gallery'
import { Separator } from '@/components/ui/separator'
import ProductSlider from '@/components/shared/product/product-slider'
import Rating from '@/components/shared/product/rating'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import AddToBrowsingHistory from '@/components/shared/product/add-to-browsing-history'
import { generateId } from '@/lib/utils'
import AddToCart from '@/components/shared/product/add-to-cart'
import { round2 } from '@/lib/utils'
import ProductDetailsClient from './product-details-client'

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params
  const product = await getProductBySlug(params.slug)
  if (!product) {
    return { title: 'Product not found' }
  }
  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductDetails(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page: string; color: string; size: string }>
}) {
  const searchParams = await props.searchParams
  const { page } = searchParams
  const params = await props.params
  const { slug } = params
  const product = await getProductBySlug(slug)

  const relatedProducts = await getRelatedProductsByCategory({
    category: product.category,
    productId: product._id,
    page: Number(page || '1'),
  })

  return (
    <div>
      <ProductDetailsClient product={product} relatedProducts={relatedProducts.data} />
      <section>
        <BrowsingHistoryList className='mt-10' />
      </section>
    </div>
  )
}