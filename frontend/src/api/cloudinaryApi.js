const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const PRESET_MAP = {
  products: import.meta.env.VITE_CLOUDINARY_PRODUCT_PRESET,
  reviews: import.meta.env.VITE_CLOUDINARY_REVIEW_PRESET,
  banners:  import.meta.env.VITE_CLOUDINARY_PRODUCT_PRESET,
};

/**
 * Upload ảnh lên Cloudinary
 * @param {File} file - File object từ input
 * @param {'products' | 'reviews'} type
 * @returns {Promise<string>} secure_url
 */
export async function uploadImage(file, type = 'reviews') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', PRESET_MAP[type]);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Upload ảnh thất bại');
  }

  const data = await res.json();
  return data.secure_url;
}