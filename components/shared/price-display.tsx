'use client'

interface PriceDisplayProps {
  price: number;
  className?: string;
}

export const PriceDisplay = ({ price, className }: PriceDisplayProps) => {
  const [int, decimal] = price.toFixed(3).split('.');
  return (
    <span className={`whitespace-nowrap ${className || ''}`}>
      <span className="font-bold">{int}</span>
      {decimal && <span className="text-sm align-super">{decimal}</span>}
      <span className="font-bold ml-1">DT</span>
    </span>
  );
}; 