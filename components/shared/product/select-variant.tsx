'use client'

import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import React from 'react'
import { getValueString } from '@/lib/utils'
import { FiCheck, FiPackage, FiDroplet, FiMaximize2 } from 'react-icons/fi'

export default function SelectVariant({
  product,
  selected,
  setSelected,
  allAttributes
}: {
  product: IProduct;
  selected: Record<string, string>
  setSelected: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  allAttributes: any[];
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

  // Get icon for attribute type
  const getAttributeIcon = (attrName: string) => {
    const lowerName = attrName.toLowerCase();
    if (lowerName.includes('couleur') || lowerName.includes('color')) return FiDroplet;
    if (lowerName.includes('taille') || lowerName.includes('size')) return FiMaximize2;
    return FiPackage;
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([attrName, values]) => {
        const Icon = getAttributeIcon(attrName);
        const isSelected = selected[attrName];
        
        return (
          <div key={attrName} className="space-y-3">
            {/* Attribute Header */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Icon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{attrName}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isSelected ? `Sélectionné: ${isSelected}` : 'Choisissez une option'}
                </p>
              </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {values.map((val) => {
                const valueStr = getValueString(val);
                const isActive = selected[attrName] === valueStr;
                
                return (
                  <button
                    key={`${attrName}-${valueStr}`}
                    type="button"
                    className={`
                      relative group p-4 rounded-xl border-2 transition-all duration-200
                      ${isActive 
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md scale-105' 
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-25 dark:hover:bg-blue-900/20'
                      }
                      cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700
                    `}
                    onClick={() => handleSelect(attrName, val)}
                  >
                    {/* Selection Indicator */}
                    {isActive && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center">
                        <FiCheck className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Option Content */}
                    <div className="text-center space-y-2">
                      {/* Color Preview (if applicable) */}
                      {attrName.toLowerCase().includes('couleur') || attrName.toLowerCase().includes('color') ? (
                        <div className="w-8 h-8 mx-auto rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                             style={{ backgroundColor: valueStr.toLowerCase() }}>
                        </div>
                      ) : (
                        <div className="w-8 h-8 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <Icon className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                        </div>
                      )}
                      
                      {/* Option Text */}
                      <span className={`
                        block text-sm font-medium transition-colors
                        ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}
                      `}>
                        {valueStr}
                      </span>
                    </div>

                    {/* Hover Effect */}
                    <div className={`
                      absolute inset-0 rounded-xl transition-opacity duration-200
                      ${isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-30'}
                      bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-800/30 dark:to-amber-800/30
                    `} />
                  </button>
                );
              })}
            </div>

            {/* Selection Summary */}
            {isSelected && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                    {attrName} sélectionné: <span className="font-semibold">{isSelected}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* No Options Message */}
      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FiPackage className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>Aucune option disponible pour ce produit</p>
        </div>
      )}
    </div>
  );
}