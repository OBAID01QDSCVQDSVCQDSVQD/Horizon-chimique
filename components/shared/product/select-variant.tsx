'use client'

import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import React from 'react'

export default function SelectVariant({
  product,
  selected,
  setSelected,
}: {
  product: IProduct
  selected: Record<string, string>
  setSelected: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  // Helper to get value as string
  const getValueString = (val: any) => typeof val === 'object' && val !== null ? val.label || val.value || '' : val || ''

  // Group attributes by attribute name
  const grouped: Record<string, string[]> = {};
  product.attributes?.forEach(attr => {
    const attrName = (attr.attribute && typeof attr.attribute === 'object' && 'name' in attr.attribute)
      ? (attr.attribute as any).name
      : attr.attribute;
    if (!grouped[attrName]) grouped[attrName] = [];
    if (!grouped[attrName].includes(attr.value)) grouped[attrName].push(attr.value);
  });

  const handleSelect = (attrName: string, value: string) => {
    setSelected(prev => ({ ...prev, [attrName]: value }));
  };

  // Find the image for the selected color
  const getColorImage = (colorName: string) => {
    // First check in attributes
    const colorAttribute = product.attributes?.find(attr => {
      if (attr && attr.attribute && typeof attr.attribute === 'object' && 'name' in attr.attribute) {
        return (attr.attribute as any).name === 'Color' && getValueString(attr.value) === colorName;
      }
      return attr.attribute === 'Color' && getValueString(attr.value) === colorName;
    })
    if (colorAttribute?.image) return colorAttribute.image

    // Then check in variants
    const colorVariant = product.variants?.find(variant =>
      variant.options.some(opt => 
        opt.attributeId === 'Color' && getValueString(opt.value) === colorName
      )
    )
    if (colorVariant?.image) return colorVariant.image

    // If no specific image found, return the first product image
    return product.images[0]
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([attrName, values]) => (
        <div key={attrName} className="space-y-2">
          <div className="font-semibold">{attrName}</div>
          <div className="flex flex-wrap gap-2">
            {values.map((val) => (
              <button
                key={val}
                type="button"
                className={`px-3 py-1 rounded border transition
                  ${selected[attrName] === val
                    ? 'bg-yellow-400 text-black border-yellow-400'
                    : 'bg-gray-200 text-gray-700 border-gray-300'}
                  cursor-pointer
                `}
                onClick={() => handleSelect(attrName, val)}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}