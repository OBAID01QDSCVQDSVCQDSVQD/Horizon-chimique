'use client'
import { useRouter } from 'next/navigation';

interface Props {
  groupedAttributes: Record<string, string[]>;
  searchParams: { [key: string]: string };
}

export default function ProductAttributesSelect({ groupedAttributes, searchParams }: Props) {
  const router = useRouter();

  // قراءة القيم المختارة من الرابط
  const selectedOptions: Record<string, string> = {};
  for (const key in searchParams) {
    selectedOptions[key.toLowerCase()] = searchParams[key];
  }

  if (!groupedAttributes || Object.keys(groupedAttributes).length === 0) return null;

  return (
    <div className='my-4'>
      {Object.entries(groupedAttributes).map(([attrName, values]) => (
        <div key={attrName} className='mb-2'>
          <div className='font-semibold'>{attrName}</div>
          <div className='flex flex-wrap gap-2 mt-1'>
            {values.map((val) => {
              const isSelected = selectedOptions[attrName.toLowerCase()] === val;
              return (
                <button
                  key={val}
                  className={`px-2 py-1 rounded text-sm border ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams as any);
                    params.set(attrName.toLowerCase(), val);
                    router.replace(`?${params.toString()}`);
                  }}
                  type="button"
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
} 