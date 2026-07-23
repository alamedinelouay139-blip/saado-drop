/**
 * Helper to construct image URLs safely.
 * Returns the URL unchanged if it is a remote HTTPS/HTTP link (like ImageKit).
 * Prepends the backend API base URL for legacy local uploads.
 * 
 * @param {string} url - The image_url from the product database.
 * @returns {string} - The fully qualified image URL.
 */
export const getImageUrl = (url) => {
  if (!url) {
    return 'https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80';
  }
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Legacy local path
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!baseUrl) {
    if (import.meta.env.DEV) {
      console.warn('VITE_API_BASE_URL is not defined. Image URL might not resolve correctly.');
    }
    // Return relative URL or a safe explicitly empty fallback
    return url;
  }
  
  // Normalize trailing slashes
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBaseUrl}${cleanUrl}`;
};
