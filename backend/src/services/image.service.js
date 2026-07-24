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

const uploadProductImage = async (fileBuffer, originalName) => {
  if (!imagekit) {
    throw new Error('ImageKit credentials are not configured.');
  }

  const uniqueSuffix = crypto.randomUUID() + '-' + Date.now();
  const ext = originalName.split('.').pop();
  const fileName = `product-${uniqueSuffix}.${ext}`;

  // ImageKit SDK is more stable with base64 strings than raw Buffers
  const base64String = fileBuffer.toString('base64');

  const uploadPromise = imagekit.upload({
    file: base64String,
    fileName: fileName,
    folder: '/saado-drop/products',
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('ImageKit upload timed out after 15 seconds')), 15000);
  });

  try {
    const result = await Promise.race([uploadPromise, timeoutPromise]);
    return {
      secure_url: result.url,
      fileId: result.fileId,
    };
  } catch (error) {
    console.error('ImageKit upload error:', error.message);
    throw new Error('Failed to upload image to ImageKit');
  }
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
