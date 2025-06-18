import { HomeCard } from '@/components/shared/home/home-card'
import { HomeCarousel } from '@/components/shared/home/home-carousel'
import { Card, CardContent } from '@/components/ui/card'
import data from '@/lib/data'
import { getAllCategories, getProductsForCard, getProductsByTag } from '@/lib/actions/product.actions' 
import ProductSlider from '@/components/shared/product/product-slider'
import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import BookingButtonWithModal from '@/components/BookingButtonWithModal'
import ReelsSection from '@/components/home/ReelsSection'

export default async function HomePage() {
  const categories = (await getAllCategories()).slice(0, 4)
  const newArrivals = await getProductsForCard({
    tag: 'new-arrival',
    limit: 4,
  })
  const featureds = await getProductsForCard({
    tag: 'featured',
    limit: 4,
  })
  const bestSellers = await getProductsForCard({
    tag: 'best-seller',
    limit: 4,
  })
  const todaysDeals = await getProductsByTag({ tag: 'todays-deal' })
  const bestSellingProducts = await getProductsByTag({ tag: 'best-seller' })
  const cards = [
    {
      title: 'Catégories à explorer',
      link: {
        text: 'Voir plus',
        href: '/categories',
      },
      items: categories.map((category) => ({
        name: category.name,
        image: category.image || '/placeholder.jpg',
        href: `/category/${category.slug}`,
      }))
    },
    {
      title: 'Découvrez les nouveautés',
      items: newArrivals,
      link: {
        text: 'Voir tout',
        href: '/search?tag=new-arrival',
      },
    },
    {
      title: 'Meilleures ventes',
      items: bestSellers,
      link: {
        text: 'Voir tout',
        href: '/search?tag=new-arrival',
      },
    },
    {
      title: 'Produits en vedette',
      items: featureds,
      link: {
        text: 'Acheter maintenant',
        href: '/search?tag=new-arrival',
      },
    },
  ]

  return (
    <>
      <HomeCarousel items={data.carousels} />
      <BookingButtonWithModal />
      {/* Reels Section */}
      <ReelsSection />
      <div className='md:p-4 md:space-y-4 bg-border'>
        <HomeCard cards={cards} />
        <Card className='w-full rounded-none'>
          <CardContent className='p-4 items-center gap-3'>
            <ProductSlider title={"Offres du jour"} products={todaysDeals} />
          </CardContent>
        </Card>
        <Card className='w-full rounded-none'>
          <CardContent className='p-4 items-center gap-3'>
            <ProductSlider title={"Produits les plus vendus"} 
            products={bestSellingProducts} 
            hideDetails
            />
          </CardContent>
        </Card>
      </div>
      <div className='p-4 bg-background'>
  <BrowsingHistoryList />
</div>
    </>
  )
}