'use client'

interface PriceDisplayProps {
  price: number;
  className?: string;
}

export const PriceDisplay = ({ price, className }: PriceDisplayProps) => {
  const [int, decimal] = price.toFixed(3).split('.');
  return (
    <span className={`whitespace-nowrap ${className || ''}`}>
      <span className="text-base font-medium">{int}</span>
      {decimal && <span className="text-xs align-super">{decimal}</span>}
      <span className="text-base font-medium ml-1">DT</span>
    </span>
  );
}; 