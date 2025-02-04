import React, { useState, useEffect } from 'react';
import { Calendar, Upload, AlertTriangle, Store, Building2 } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { productTranslations } from '../../translations/products';
import { useBarcodeService } from '../../hooks/useBarcodeService';
import { useImageUpload } from '../../hooks/useImageUpload';
import type { Product, ProductType } from '../../types/product';
import type { VendorAssignment } from '../../types/vendor';

interface Props {
  onSubmit: (product: Partial<Product>) => void;
  initialData?: Product;
  ownerBusinessCode: string;
  vendorBusinessCode: string;
  assignments: VendorAssignment[];
  onCancel: () => void;
}

export function VendorProductForm({ 
  onSubmit, 
  initialData, 
  ownerBusinessCode,
  vendorBusinessCode,
  assignments,
  onCancel 
}: Props) {
  const { language } = useLanguageStore();
  const t = productTranslations[language];
  const { upload, isUploading, error: uploadError } = useImageUpload();
  const { generateProductBarcode } = useBarcodeService();

  const [type, setType] = useState<ProductType>(initialData?.type || 'non-food');
  const [expiryDate, setExpiryDate] = useState(initialData?.expiry_date || '');
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [barcode, setBarcode] = useState(initialData?.barcode || '');
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState(initialData?.branch_name || '');

  // Get the current business name
  const currentBusiness = assignments.find(a => a.owner_business_code === ownerBusinessCode);

  // Get available branches for selected business
  const availableBranches = assignments
    .filter(a => a.owner_business_code === ownerBusinessCode)
    .map(a => a.branch_name);

  const generateBarcode = async (productName: string, price: number) => {
    try {
      const generatedBarcode = await generateProductBarcode({
        productId: Math.random().toString(36).substring(7),
        vendorId: vendorBusinessCode,
        name: productName,
        price
      });
      setBarcode(generatedBarcode);
      return generatedBarcode;
    } catch (err) {
      console.error('Error generating barcode:', err);
      return null;
    }
  };

  // Show error if no branch is selected
  useEffect(() => {
    if (ownerBusinessCode !== 'all' && !selectedBranch) {
      setError(t.selectBranchFirst);
    } else {
      setError(null);
    }
  }, [ownerBusinessCode, selectedBranch]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      try {
        const uploadedUrl = await upload(file);
        if (uploadedUrl) {
          setImageUrl(uploadedUrl);
        }
      } catch (err) {
        setError(t.errorUploadingImage);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    if (ownerBusinessCode === 'all') {
      setError(t.selectBusinessFirst); 
      return;
    }

    if (!selectedBranch) {
      setError(t.selectBranchFirst);
      return;
    }

    // Get form data
    const formData = new FormData(e.currentTarget);
    const productName = formData.get('product_name') as string;
    const price = parseFloat(formData.get('price') as string);

    // Generate barcode if not editing
    let productBarcode = barcode;
    if (!initialData && !productBarcode) {
      productBarcode = await generateBarcode(productName, price);
      if (!productBarcode) {
        setError(t.errorGeneratingBarcode);
        return;
      }
    }

    const productData: Partial<Product> = {
      product_name: productName,
      type,
      price,
      quantity: parseInt(formData.get('quantity') as string, 10),
      description: formData.get('description') as string,
      image_url: imageUrl,
      barcode: productBarcode,
      business_code_of_owner: ownerBusinessCode,
      business_code_if_vendor: vendorBusinessCode,
      branch_name: selectedBranch,
      current_page: 'upcoming_products',
      accepted: false,
      trackable: type === 'food'
    };

    if (type === 'food' && expiryDate) {
      productData.expiry_date = expiryDate;
    }

    try {
      await onSubmit(productData);
    } catch (err) {
      setError(t.errorSavingProduct);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Business and Branch Selection */}
      <div className={`border rounded-lg p-4 space-y-4 ${ownerBusinessCode === 'all' ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100'}`}>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Store className={`w-5 h-5 ${ownerBusinessCode === 'all' ? 'text-red-600' : 'text-indigo-600'}`} />
          <span className="font-medium">{t.sendingTo}:</span>
          <span className={ownerBusinessCode === 'all' ? 'text-red-700 font-bold' : 'text-indigo-700'}>
            {currentBusiness?.owner_business_name || t.selectBusiness}
          </span>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <Building2 className={`w-5 h-5 ${ownerBusinessCode === 'all' ? 'text-red-600' : 'text-indigo-600'}`} />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            required
            className={`flex-1 border rounded-md focus:ring-2 ${
              ownerBusinessCode === 'all' 
                ? 'bg-red-50 focus:ring-red-500 focus:border-red-500 cursor-not-allowed' 
                : 'focus:ring-indigo-500 focus:border-indigo-500'
            }`}
            disabled={ownerBusinessCode === 'all'}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <option value="">{t.selectBranch}</option>
            {availableBranches.map(branch => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="mr-3">
            <p className="text-sm text-yellow-700">
              {t.pendingApprovalNotice}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Image */}
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

        {/* Product Type */}
        <div>
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

        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.productName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="product_name"
            defaultValue={initialData?.product_name}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.price} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            defaultValue={initialData?.price}
            step="0.001"
            min="0"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            dir="ltr"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.quantity} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="quantity"
            defaultValue={initialData?.quantity}
            min="0"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            dir="ltr"
          />
        </div>

        {/* Expiry Date for Food Products */}
        {type === 'food' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t.expiryDate} <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
                className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Description */}
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

      {/* Error Message */}
      {(error || uploadError) && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="mr-3">
              <p className="text-sm text-red-700">{error || uploadError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 space-x-reverse">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={isUploading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUploading ? t.uploading : initialData ? t.updateProduct : t.addProduct}
        </button>
      </div>
    </form>
  );
}