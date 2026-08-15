import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = (): boolean => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload an image to Cloudinary
 * @param fileBuffer - The image file buffer
 * @param folder - Cloudinary folder (e.g., 'providers')
 * @param publicId - Optional public ID for the image
 * @returns Promise with Cloudinary upload result
 */
export const uploadImage = async (
  fileBuffer: Buffer,
  folder: string,
  publicId?: string
): Promise<{ url: string; publicId: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      resource_type: 'image',
      // Transform to square 1200x1200, high quality
      transformation: [
        { width: 1200, height: 1200, crop: 'fill', gravity: 'face', quality: 'auto:good' },
      ],
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: any, result: any) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload image'));
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Upload a blog featured image to Cloudinary (landscape 1200×630 crop)
 */
export const uploadBlogImage = async (
  fileBuffer: Buffer,
  publicId?: string
): Promise<{ url: string; publicId: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: 'blog',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 630, crop: 'fill', gravity: 'auto', quality: 'auto:good' },
      ],
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error: any, result: any) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload image'));
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete an image from Cloudinary
 * @param publicId - The Cloudinary public ID
 * @returns Promise with deletion result
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Generate a transformed image URL
 * @param publicId - The Cloudinary public ID
 * @param width - Target width
 * @param height - Target height
 * @returns Transformed image URL
 */
export const getTransformedImageUrl = (
  publicId: string,
  width: number,
  height: number
): string => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:good',
    fetch_format: 'auto', // Automatically use WebP if supported
  });
};

/**
 * Upload a provider verification document to Cloudinary as a private raw asset.
 * The public_id is stored in MongoDB; the file is never exposed via a public URL.
 */
export const uploadDocument = async (
  fileBuffer: Buffer,
  fileName: string
): Promise<{ publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'provider-documents',
        resource_type: 'raw',
        type: 'private',
        use_filename: false,
      },
      (error: any, result: any) => {
        if (error) {
          console.error('Cloudinary document upload error:', error);
          reject(new Error('Failed to upload document'));
        } else if (result) {
          resolve({ publicId: result.public_id });
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Download a private raw document from Cloudinary and return it as a Buffer.
 * Used by the auth-gated streaming endpoint — the URL is never sent to the client.
 */
export const downloadDocument = async (publicId: string): Promise<{ buffer: Buffer; contentType: string }> => {
  const url = cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'private',
    sign_url: true,
    secure: true,
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch document from Cloudinary: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  return { buffer: Buffer.from(arrayBuffer), contentType };
};

/**
 * Generate a short-lived signed URL for a private raw document.
 * Expires in 5 minutes — intended for admin one-time viewing only.
 */
export const getDocumentSignedUrl = (publicId: string): string => {
  const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 minutes
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'private',
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  });
};

/**
 * Delete a raw private document from Cloudinary.
 */
export const deleteDocument = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', type: 'private' });
  } catch (error) {
    console.error('Cloudinary document delete error:', error);
    throw new Error('Failed to delete document');
  }
};

export { cloudinary };
