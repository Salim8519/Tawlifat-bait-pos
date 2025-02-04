import { commonTranslations } from '../translations/common';

const IMGBB_API_KEY = '245f27a93a29e9ceb49f878bb043d8cf';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url: string;
    display_url: string;
    size: number;
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Uploads an image to imgBB and returns the URL
 * @param file The image file to upload
 * @param language The current language for error messages
 * @returns The URL of the uploaded image
 * @throws Error if upload fails
 */
export async function uploadImage(file: File, language: 'ar' | 'en'): Promise<string> {
  const t = commonTranslations[language];
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error(t.invalidImageType);
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error(t.imageTooLarge);
  }

  try {
    // Create form data
    const formData = new FormData();
    formData.append('image', file);

    // Make API request
    const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as ImgBBResponse;

    if (!result.success) {
      throw new Error('Upload failed');
    }

    // Return the display URL
    return result.data.display_url;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error(t.imageUploadFailed);
  }
}