import { useState } from 'react';
import { useLanguageStore } from '../store/useLanguageStore';
import { uploadImage } from '../services/imageService';

export function useImageUpload() {
  const { language } = useLanguageStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const url = await uploadImage(file, language);
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    upload,
    isUploading,
    error
  };
}