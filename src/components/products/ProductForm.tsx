import React, { useState, useEffect } from 'react';
import { Calendar, Upload, Barcode } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getUserMainBranch } from '../../services/profileService';
import { useBusinessStore } from '../../store/useBusinessStore';
import { productTranslations } from '../../translations/products';
import { useBarcodeService } from '../../hooks/useBarcodeService';
import type { Product, ProductType } from '../../types/product';
import { useImageUpload } from '../../hooks/useImageUpload';

interface ProductFormProps {
  onSubmit: (product: Partial<Product>) => void;
  initialData?: Product;
}

export function ProductForm({ onSubmit, initialData }: ProductFormProps) {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { branches } = useBusinessStore();
  const t = productTranslations[language];
  const [mainBranch, setMainBranch] = React.useState<string | null>(null);
  const { generateProductBarcode } = useBarcodeService();
  const { upload, isUploading } = useImageUpload();

  // Format date string for datetime-local input
  // Format date string for datetime-local input
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const [type, setType] = React.useState<ProductType>(initialData?.type || 'non-food');
  const [expiryDate, setExpiryDate] = React.useState(formatDateForInput(initialData?.expiry_date));
  const [productionDate, setProductionDate] = React.useState(formatDateForInput(initialData?.production_date));
  const [imageUrl, setImageUrl] = React.useState<string | null>(initialData?.image_url || null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(initialData?.image_url || null);
  const [generatedBarcode, setGeneratedBarcode] = React.useState(initialData?.barcode || '');
  const [selectedBranch, setSelectedBranch] = useState(initialData?.branch_name || mainBranch || '');
  const formRef = React.useRef<HTMLFormElement>(null);

  useEffect(() => {
    const loadMainBranch = async () => {
      if (user?.id && !initialData) {
        try {
          const branch = await getUserMainBranch(user.id);
          setMainBranch(branch);
          if (branch) {
            setSelectedBranch(branch);
          }
        } catch (error) {
          console.error('Error loading main branch:', error);
        }
      }
    };

    loadMainBranch();
  }, [user?.id, initialData]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Upload to imgBB
      const uploadedUrl = await upload(file);
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
      }
    }
  };

  const generateBarcode = async () => {
    if (!formRef.current) return;
    
    const formData = new FormData(formRef.current);
    const productName = formData.get('product_name') as string;
    
    if (!productName) return;
    
    // Generate a temporary ID for new products
    const tempId = Math.random().toString(36).substring(7);
    const tempVendorId = Math.random().toString(36).substring(7);
    
    try {
      const barcode = await generateProductBarcode({
        productId: initialData?.product_id?.toString() || tempId,
        vendorId: initialData?.vendorId || tempVendorId,
        name: productName,
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
    const productName = formData.get('product_name') as string;
    const price = parseFloat(formData.get('price') as string);
    const quantity = parseInt(formData.get('quantity') as string, 10);
    
    const product: Partial<Product> = {
      product_name: productName,
      type: type,
      production_date: productionDate || null,
      expiry_date: expiryDate || null,
      branch_name: selectedBranch,
      price,
      quantity,
      barcode: generatedBarcode,
      description: formData.get('description') as string,
      image_url: imageUrl || undefined,
      trackable: type === 'food',
      business_code_of_owner: user?.businessCode || '',
      current_page: 'products',
      accepted: true
    };

    onSubmit(product);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Upload */}
        <div className="col-span-2">
          <label className="block text-base font-semibold text-gray-900 mb-2">
            {t.productImage} <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex-1">
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="h-48 w-48 object-cover rounded-lg shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageUrl('');
                      }}
                      className="absolute top-2 right-2 bg-red-100 text-red-600 rounded-full p-1.5 hover:bg-red-200 shadow-sm transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                        <span>{t.chooseImage}</span>
                        <input
                          type="file"
                          accept="image/*"
                          required={!initialData?.image_url}
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
        
        {/* Branch Selector */}
        <div className="col-span-2">
          <label className="block text-base font-semibold text-gray-900">
            {t.branch} <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            required
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <option value="">{t.selectBranch}</option>
            {branches.filter(branch => branch.is_active).map(branch => (
              <option key={branch.branch_id} value={branch.branch_name}>
                {branch.branch_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-900">
            {t.productType} <span className="text-red-500">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ProductType)}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
          >
            <option value="food">{t.food}</option>
            <option value="non-food">{t.nonFood}</option>
          </select>
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-900">
            {t.productName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="product_name"
            defaultValue={initialData?.product_name}
            onChange={handleNameChange}
            required
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
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
          <label className="block text-base font-semibold text-gray-900">
            {t.price} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            defaultValue={initialData?.price}
            step="0.01"
            required
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
          />
        </div>

        <div>
          <label className="block text-base font-semibold text-gray-900">
            {t.quantity} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="quantity"
            defaultValue={initialData?.quantity}
            required
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
          />
        </div>

        {type === 'food' && (
          <>
            <div>
              <label className="block text-base font-semibold text-gray-900">
                {t.productionDate} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={productionDate || ''}
                onChange={(e) => setProductionDate(e.target.value)}
                required={type === 'food'}
                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-900">
                {t.expiryDate} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expiryDate || ''}
                onChange={(e) => setExpiryDate(e.target.value)}
                required={type === 'food'}
                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
              />
            </div>
          </>
        )}

        <div className="col-span-2">
          <label className="block text-base font-semibold text-gray-900">
            {t.description}
            <span className="text-gray-500 text-xs mr-1">({t.optional})</span>
          </label>
          <textarea
            name="description"
            defaultValue={initialData?.description}
            rows={3}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-indigo-600 text-white text-lg font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm transition-colors duration-200"
        >
          {initialData ? t.updateProduct : t.addNewProduct}
        </button>
      </div>
    </form>
  );
}