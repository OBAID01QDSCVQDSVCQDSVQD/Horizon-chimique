// app/category/[slug]/page.tsx

import { getAllCategories, getProductsByCategorySlug, getCategoryBySlug } from '@/lib/actions/product.actions';
import Image from 'next/image';
import Link from 'next/link';
import { IProduct } from '@/lib/db/models/product.model';

export async function generateStaticParams() {
  const categories = await getAllCategories();

  return categories.map((cat: any) => ({
    slug: cat.slug,
  }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  const products: IProduct[] = await getProductsByCategorySlug(slug);

  if (!category) {
    return <div className="p-8 text-center text-xl">Category not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-8">
        {category.image && (
          <Image src={category.image} alt={category.name} width={60} height={60} className="rounded" />
        )}
        <h1 className="text-3xl font-bold">{category.name}</h1>
      </div>
      {products.length === 0 ? (
        <div className="text-center text-lg">No products found in this category.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: IProduct) => (
            <Link
              key={product._id}
              href={`/product/${product.slug}`}
              className="border rounded p-3 flex flex-col items-center hover:shadow-lg transition"
            >
              <Image src={product.images?.[0] && product.images[0].trim() !== "" ? product.images[0] : '/placeholder.jpg'} alt={product.name} width={120} height={120} className="object-contain mb-2" />
              <div className="font-semibold text-center">{product.name}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
