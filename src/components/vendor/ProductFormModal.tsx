import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { productTranslations } from '../../translations/products';
import { ProductForm } from '../products/ProductForm';
import type { Product } from '../../types/pos';

interface Props {
  show: boolean;
  onClose: () => void;
  onSubmit: (product: Partial<Product>) => void;
  editingProduct: Product | null;
}

export function ProductFormModal({ show, onClose, onSubmit, editingProduct }: Props) {
  const { language } = useLanguageStore();
  const t = productTranslations[language];

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingProduct ? t.editProduct : t.addProduct}
        </h2>
        <ProductForm
          onSubmit={onSubmit}
          initialData={editingProduct || undefined}
        />
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}