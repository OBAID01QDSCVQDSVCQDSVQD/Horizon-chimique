import { getProductBySlug } from '@/lib/db/actions/product.actions';
import { getAllAttributes } from '@/lib/db/actions/attribute.actions';
import { getAllCategories, getAllCatalogues } from '@/lib/db/actions/category.actions';
import EditProductForm from '@/components/shared/product/edit-product-form';

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EditProductPage({
  params,
}: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const attributes = await getAllAttributes();

  // Get categories using server action
  const categories = await getAllCategories();

  // Get catalogues using server action
  const catalogues = await getAllCatalogues();

  return (
    <EditProductForm 
      product={product} 
      attributes={attributes}
      categories={categories}
      catalogues={catalogues}
    />
  );
} 