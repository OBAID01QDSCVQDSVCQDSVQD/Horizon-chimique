import { connectToDatabase } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/product.model'
import ProductCard from '@/components/shared/product/product-card'
import { Category } from '@/lib/db/models/category.model'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>
}

export default async function Page({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params?.q || '';
  const category = params?.category || 'All';

  await connectToDatabase()

  let searchQuery: any = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ]
  }

  if (category && category !== 'All') {
    const categoryDoc = await Category.findOne({ slug: category }).select('_id')
    if (categoryDoc) {
      searchQuery.category = categoryDoc._id
    } else {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">
            {query ? `Résultats de recherche pour "${query}"` : 'Tous les produits'}
            {category !== 'All' && ` dans ${category}`}
          </h1>
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun produit trouvé</p>
          </div>
        </div>
      )
    }
  }

  const products = await Product.find(searchQuery)
    .select('name description price images category slug')
    .limit(20) || []

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {query ? `Résultats de recherche pour "${query}"` : 'Tous les produits'}
        {category !== 'All' && ` dans ${category}`}
      </h1>

      {Array.isArray(products) && products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.isArray(products) && products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
} 