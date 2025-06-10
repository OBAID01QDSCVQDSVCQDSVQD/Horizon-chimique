import Link from 'next/link';

export default function CategoriesSection({ categories }: { categories: any[] }) {
  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold mb-6 text-center">تصفح التصنيفات</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            href={`/category/${cat.slug}`}
            className="flex flex-col items-center bg-white dark:bg-zinc-900 rounded-lg shadow hover:scale-105 transition p-4"
          >
            <img
              src={cat.image || '/placeholder.jpg'}
              alt={cat.name}
              className="w-24 h-24 object-contain mb-2"
            />
            <span className="font-medium">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
} 