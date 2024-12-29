import React from 'react';
import { ProductCard } from '../products/ProductCard';
import type { Product } from '../../types/pos';

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
}

export function ProductGrid({ products, onEdit }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}