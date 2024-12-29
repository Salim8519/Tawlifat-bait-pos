import React from 'react';
import { Calendar, Upload, Barcode } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { productTranslations } from '../../translations/products';
import { useBarcodeService } from '../../hooks/useBarcodeService';
import type { Product, ProductType } from '../../types/pos';

interface ProductFormProps {
  onSubmit: (product: Partial<Product>) => void;
  initialData?: Product;
}

export function ProductForm({ onSubmit, initialData }: ProductFormProps) {
  const { language } = useLanguageStore();
  const t = productTranslations[language];
  const { generateProductBarcode } = useBarcodeService();

  const [type, setType] = React.useState<ProductType>(initialData?.type || 'non-food');
  const [expiryDate, setExpiryDate] = React.useState(initialData?.expiryDate || '');
  const [preparationDate, setPreparationDate] = React.useState(initialData?.preparationDate || '');
  const [imageUrl, setImageUrl] = React.useState(initialData?.imageUrl || '');
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [generatedBarcode, setGeneratedBarcode] = React.useState(initialData?.barcode || '');
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageUrl(previewUrl);
    }
  };

  const generateBarcode = async () => {
    if (!formRef.current) return;
    
    const formData = new FormData(formRef.current);
    const nameAr = formData.get('nameAr') as string;
    
    if (!nameAr) return;
    
    // Generate a temporary ID for new products
    const tempId = Math.random().toString(36).substring(7);
    const tempVendorId = Math.random().toString(36).substring(7);
    
    try {
      const barcode = await generateProductBarcode({
        productId: initialData?.id || tempId,
        vendorId: initialData?.vendorId || tempVendorId,
        name: nameAr,
        price: parseFloat(formData.get('price') as string) || 0
      });
      
      setGeneratedBarcode(barcode);
    } catch (error) {
      console.error('Failed to generate barcode:', error);
    }
  };

  // Generate barcode when product name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      generateBarcode();
    } else {
      setGeneratedBarcode('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const product: Partial<Product> = {
      nameAr: formData.get('nameAr') as string,
      type: type,
      price: parseFloat(formData.get('price') as string),
      quantity: parseInt(formData.get('quantity') as string, 10),
      category: formData.get('category') as string,
      barcode: generatedBarcode,
      description: formData.get('description') as string,
      imageUrl: imageUrl,
    };

    if (type === 'food') {
      product.expiryDate = expiryDate;
      if (preparationDate) {
        product.preparationDate = preparationDate;
      }
    }

    onSubmit(product);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Upload */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.productImage} <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex-1">
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="h-40 w-40 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageUrl('');
                      }}
                      className="absolute top-0 right-0 -mr-2 -mt-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                        <span>{t.chooseImage}</span>
                        <input
                          type="file"
                          accept="image/*"
                          required={!initialData?.imageUrl}
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">{t.uploadInstructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

          <label className="block text-sm font-medium text-gray-700">
            {t.productType} <span className="text-red-500">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ProductType)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="food">{t.food}</option>
            <option value="non-food">{t.nonFood}</option>
          </select>
        </div>

        <div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.productName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nameAr"
            defaultValue={initialData?.nameAr}
            onChange={handleNameChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.barcode}
          </label>
          <div className="mt-1 flex items-center space-x-2 space-x-reverse">
            <div className="relative flex-1">
              <Barcode className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={generatedBarcode}
                readOnly
                className="block w-full pr-10 rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                dir="ltr"
              />
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {t.barcodeGeneratedAutomatically}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.price} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            defaultValue={initialData?.price}
            step="0.01"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.quantity} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="quantity"
            defaultValue={initialData?.quantity}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.barcode}
            <span className="text-gray-500 text-xs mr-1">({t.optional})</span>
          </label>
          <input
            type="text"
            name="barcode"
            defaultValue={initialData?.barcode}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            dir="ltr"
          />
        </div>

        {type === 'food' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t.productionDate}
                <span className="text-gray-500 text-xs mr-1">({t.optional})</span>
              </label>
              <div className="relative mt-1">
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={preparationDate}
                  onChange={(e) => setPreparationDate(e.target.value)}
                  className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t.expiryDate} <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                  className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </>
        )}

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            {t.description}
            <span className="text-gray-500 text-xs mr-1">({t.optional})</span>
          </label>
          <textarea
            name="description"
            defaultValue={initialData?.description}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {initialData ? t.updateProduct : t.addNewProduct}
        </button>
      </div>
    </form>
  );
}