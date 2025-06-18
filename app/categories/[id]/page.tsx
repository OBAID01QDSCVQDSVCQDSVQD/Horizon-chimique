'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { Document } from 'mongoose';
import ProductPrice from '@/components/shared/product/product-price';
import ProductSkeleton from '@/components/shared/product/product-skeleton';

interface Product extends Document {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  categories: string[];
  slug: string;
}

interface Category extends Document {
  _id: string;
  name: string;
  description?: string;
  image?: string;
}

// Function to clean HTML from text
const cleanHtml = (html: string) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export default function CategoryProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!resolvedParams?.id) return;
      
      try {
        // Fetch category details
        const categoryResponse = await fetch(`/api/categories/${resolvedParams.id}`);
        if (!categoryResponse.ok) {
          throw new Error('Failed to fetch category');
        }
        const categoryData = await categoryResponse.json();
        setCategory(categoryData);

        // Fetch products for this category
        const productsResponse = await fetch(`/api/products?category=${resolvedParams.id}`);
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams?.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <ProductSkeleton />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-red-600">الفئة غير موجودة</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 max-w-2xl">{category.description}</p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">لا توجد منتجات في هذه الفئة</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link href={`/product/${product.slug}`} key={product._id.toString()}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="relative h-48 w-full">
                  <Image
                    src={product.images?.[0] || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {cleanHtml(product.description)}
                  </CardDescription>
                  <div className="mt-2">
                    <ProductPrice price={product.price} />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 