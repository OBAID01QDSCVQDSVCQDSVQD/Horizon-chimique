'use client'

import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import React from 'react'
import { getValueString } from '@/lib/utils'

export default function SelectVariant({
  product,
  selected,
  setSelected,
  allAttributes // Accept allAttributes here
}: {
  product: IProduct; // Use IProduct directly
  selected: Record<string, string>
  setSelected: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  allAttributes: any[]; // Define type for allAttributes
}) {
  // Helper to get value as string
  // const getValueString = (val: any) => typeof val === 'object' && val !== null ? val.label || val.value || '' : val || ''

  // Group attributes by attribute name based on actual variants
  const grouped: Record<string, string[]> = {};

  product.variants?.forEach(variant => {
    variant.options.forEach((opt: any) => {
      // Find the corresponding attribute from allAttributes based on attributeId
      const foundAttribute = allAttributes.find((attr: any) => attr._id.toString() === opt.attributeId.toString());
      
      if (foundAttribute) {
        const attrName = foundAttribute.name;
        const attrValue = getValueString(opt.value);

        if (attrName) {
          if (!grouped[attrName]) {
            grouped[attrName] = [];
          }
          if (!grouped[attrName].includes(attrValue)) {
            grouped[attrName].push(attrValue);
          }
        }
      }
    });
  });

  const handleSelect = (attrName: string, value: string) => {
    setSelected(prev => ({ ...prev, [attrName]: getValueString(value) }));
  };

  // Find the image for the selected color
  const getColorImage = (colorName: string) => {
    // First check in attributes, now using allAttributes to resolve name from ID
    const colorAttribute = product.attributes?.find(attr => {
      const resolvedAttribute = allAttributes.find((a:any) => a._id.toString() === attr.attribute.toString());
      return resolvedAttribute?.name === 'Color' && getValueString(attr.value) === colorName;
    })
    if (colorAttribute?.image) return colorAttribute.image

    // Then check in variants
    const colorVariant = product.variants?.find(variant =>
      variant.options.some(opt => {
        const resolvedAttribute = allAttributes.find((a:any) => a._id.toString() === opt.attributeId.toString());
        return resolvedAttribute?.name === 'Color' && getValueString(opt.value) === colorName;
      })
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
                key={`${attrName}-${getValueString(val)}`}
                type="button"
                className={`px-3 py-1 rounded border transition
                  ${selected[attrName] === getValueString(val)
                    ? 'bg-yellow-400 text-black border-yellow-400'
                    : 'bg-gray-200 text-gray-700 border-gray-300'}
                  cursor-pointer
                `}
                onClick={() => handleSelect(attrName, val)}
              >
                {getValueString(val)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}