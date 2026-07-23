const ImageKit = require('imagekit');
const env = require('../config/env');
const crypto = require('crypto');

let imagekit = null;

if (env.IMAGEKIT_PUBLIC_KEY && env.IMAGEKIT_PRIVATE_KEY && env.IMAGEKIT_URL_ENDPOINT) {
  imagekit = new ImageKit({
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    privateKey: env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
  });
}

/**
 * Uploads a product image buffer to ImageKit.
 * @param {Buffer} fileBuffer - The image file buffer.
 * @param {string} originalName - Original filename.
 * @returns {Promise<{ secure_url: string, fileId: string }>}
 */
const uploadProductImage = async (fileBuffer, originalName) => {
  if (!imagekit) {
    throw new Error('ImageKit credentials are not configured.');
  }

  const uniqueSuffix = crypto.randomUUID() + '-' + Date.now();
  const ext = originalName.split('.').pop();
  const fileName = `product-${uniqueSuffix}.${ext}`;

  const result = await imagekit.upload({
    file: fileBuffer,
    fileName: fileName,
    folder: '/saado-drop/products',
  });

  return {
    secure_url: result.url,
    fileId: result.fileId,
  };
};

/**
 * Deletes a product image from ImageKit by its file ID.
 * @param {string} fileId - The file ID of the image to delete.
 * @returns {Promise<boolean>} - True if deletion was successful.
 */
const deleteProductImage = async (fileId) => {
  if (!fileId) return false;
  if (!imagekit) {
    console.warn('ImageKit credentials are not configured. Cannot delete image.');
    return false;
  }

  try {
    await imagekit.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error(`Failed to delete ImageKit image (${fileId}):`, error.message);
    return false;
  }
};

module.exports = {
  uploadProductImage,
  deleteProductImage,
};
