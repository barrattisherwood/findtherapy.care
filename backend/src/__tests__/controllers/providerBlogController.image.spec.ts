import { Response } from 'express';
import mongoose from 'mongoose';
import BlogPost from '../../models/BlogPost';
import { uploadFeaturedImage, removeFeaturedImage } from '../../controllers/providerBlogController';
import { ProviderAuthRequest } from '../../middleware/providerGuard';
import * as cloudinaryService from '../../services/cloudinaryService';
import { createTestUser } from '../fixtures/users';
import { createTestProvider } from '../fixtures/providers';

jest.mock('../../services/cloudinaryService');
jest.mock('../../services/emailService', () => ({
  sendBlogPostPendingReviewEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockUploadBlogImage = cloudinaryService.uploadBlogImage as jest.Mock;
const mockDeleteImage = cloudinaryService.deleteImage as jest.Mock;
const mockIsConfigured = cloudinaryService.isCloudinaryConfigured as jest.Mock;

const makeMockResponse = () => {
  const responseJson = jest.fn();
  const responseStatus = jest.fn().mockReturnThis();
  const mockResponse = {
    json: responseJson,
    status: responseStatus,
  } as unknown as Response;
  return { responseJson, responseStatus, mockResponse };
};

const makePost = async (providerId: mongoose.Types.ObjectId, overrides: Record<string, unknown> = {}) =>
  BlogPost.create({
    title: `Test Post ${Date.now()}`,
    slug: `test-post-image-${Date.now()}`,
    content: 'Content',
    excerpt: 'Excerpt',
    author: new mongoose.Types.ObjectId(),
    authorType: 'provider',
    authorProviderId: providerId,
    categories: [],
    tags: [],
    providerApproved: true,
    ...overrides,
  });

describe('uploadFeaturedImage (provider blog)', () => {
  beforeEach(() => {
    mockIsConfigured.mockReturnValue(true);
    mockUploadBlogImage.mockResolvedValue({
      url: 'https://res.cloudinary.com/test/image/upload/blog/img.jpg',
      publicId: 'blog/img',
      width: 1200,
      height: 630,
    });
  });

  it('returns 400 when no file is provided', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await makePost(provider._id);
    const { responseStatus, responseJson, mockResponse } = makeMockResponse();

    await uploadFeaturedImage(
      { userId: user._id.toString(), provider, params: { id: post._id.toString() } } as unknown as ProviderAuthRequest,
      mockResponse
    );

    expect(responseStatus).toHaveBeenCalledWith(400);
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({ message: 'No image file provided' }));
  });

  it('saves featuredImage url and publicId on success', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await makePost(provider._id);
    const { responseJson, mockResponse } = makeMockResponse();

    await uploadFeaturedImage(
      {
        userId: user._id.toString(),
        provider,
        params: { id: post._id.toString() },
        file: { buffer: Buffer.from('img'), mimetype: 'image/jpeg' },
      } as unknown as ProviderAuthRequest,
      mockResponse
    );

    expect(mockUploadBlogImage).toHaveBeenCalledWith(expect.any(Buffer));
    const result = responseJson.mock.calls[0][0];
    expect(result.featuredImage).toBe('https://res.cloudinary.com/test/image/upload/blog/img.jpg');
    expect(result.featuredImagePublicId).toBe('blog/img');
  });

  it('resets providerApproved to false on upload', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await makePost(provider._id, { providerApproved: true });
    const { responseJson, mockResponse } = makeMockResponse();

    await uploadFeaturedImage(
      {
        userId: user._id.toString(),
        provider,
        params: { id: post._id.toString() },
        file: { buffer: Buffer.from('img'), mimetype: 'image/png' },
      } as unknown as ProviderAuthRequest,
      mockResponse
    );

    expect(responseJson.mock.calls[0][0].providerApproved).toBe(false);
  });

  it('returns 404 when post belongs to a different provider', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const other = await createTestProvider({ userId: new mongoose.Types.ObjectId().toString() });
    const post = await makePost(other._id);
    const { responseStatus, mockResponse } = makeMockResponse();

    await uploadFeaturedImage(
      {
        userId: user._id.toString(),
        provider,
        params: { id: post._id.toString() },
        file: { buffer: Buffer.from('img'), mimetype: 'image/webp' },
      } as unknown as ProviderAuthRequest,
      mockResponse
    );

    expect(responseStatus).toHaveBeenCalledWith(404);
  });

  it('returns 500 when Cloudinary is not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await makePost(provider._id);
    const { responseStatus, mockResponse } = makeMockResponse();

    await uploadFeaturedImage(
      {
        userId: user._id.toString(),
        provider,
        params: { id: post._id.toString() },
        file: { buffer: Buffer.from('img'), mimetype: 'image/jpeg' },
      } as unknown as ProviderAuthRequest,
      mockResponse
    );

    expect(responseStatus).toHaveBeenCalledWith(500);
  });
});

describe('removeFeaturedImage (provider blog)', () => {
  beforeEach(() => {
    mockDeleteImage.mockResolvedValue(undefined);
  });

  it('clears featuredImage and featuredImagePublicId', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await makePost(provider._id, {
      featuredImage: 'https://res.cloudinary.com/test/blog/old.jpg',
      featuredImagePublicId: 'blog/old',
    });
    const { responseJson, mockResponse } = makeMockResponse();

    await removeFeaturedImage(
      { userId: user._id.toString(), provider, params: { id: post._id.toString() } } as unknown as ProviderAuthRequest,
      mockResponse
    );

    const result = responseJson.mock.calls[0][0];
    expect(result.featuredImage).toBeUndefined();
    expect(result.featuredImagePublicId).toBeUndefined();
  });

  it('resets providerApproved to false on remove', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await makePost(provider._id, {
      featuredImage: 'https://res.cloudinary.com/test/blog/old.jpg',
      featuredImagePublicId: 'blog/old',
      providerApproved: true,
    });
    const { responseJson, mockResponse } = makeMockResponse();

    await removeFeaturedImage(
      { userId: user._id.toString(), provider, params: { id: post._id.toString() } } as unknown as ProviderAuthRequest,
      mockResponse
    );

    expect(responseJson.mock.calls[0][0].providerApproved).toBe(false);
  });

  it('calls deleteImage with the stored publicId', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await makePost(provider._id, { featuredImagePublicId: 'blog/old' });
    const { mockResponse } = makeMockResponse();

    await removeFeaturedImage(
      { userId: user._id.toString(), provider, params: { id: post._id.toString() } } as unknown as ProviderAuthRequest,
      mockResponse
    );

    expect(mockDeleteImage).toHaveBeenCalledWith('blog/old');
  });

  it('returns 404 when post belongs to a different provider', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const other = await createTestProvider({ userId: new mongoose.Types.ObjectId().toString() });
    const post = await makePost(other._id, { featuredImagePublicId: 'blog/old' });
    const { responseStatus, mockResponse } = makeMockResponse();

    await removeFeaturedImage(
      { userId: user._id.toString(), provider, params: { id: post._id.toString() } } as unknown as ProviderAuthRequest,
      mockResponse
    );

    expect(responseStatus).toHaveBeenCalledWith(404);
  });
});
