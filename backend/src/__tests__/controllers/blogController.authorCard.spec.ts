import { Request, Response } from 'express';
import BlogPost from '../../models/BlogPost';
import { Provider } from '../../models/Provider';
import { getBlogPostBySlug } from '../../controllers/blogController';
import { createTestUser } from '../fixtures/users';
import { createTestProvider } from '../fixtures/providers';
import mongoose from 'mongoose';

const makeMockResponse = () => {
  const responseJson = jest.fn();
  const responseStatus = jest.fn().mockReturnThis();
  const mockResponse = {
    json: responseJson,
    status: responseStatus,
  } as unknown as Response;
  return { responseJson, responseStatus, mockResponse };
};

const makePublishedPost = async (overrides: Record<string, unknown> = {}) => {
  const user = await createTestUser();
  return BlogPost.create({
    title: `Test Post ${Date.now()}`,
    slug: `test-post-${Date.now()}`,
    content: 'Some content',
    excerpt: 'Excerpt',
    author: user._id,
    status: 'published',
    publishedAt: new Date(),
    categories: [],
    tags: [],
    ...overrides,
  });
};

describe('getBlogPostBySlug — author card', () => {
  it('includes authorSummary for approved published provider posts', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await makePublishedPost({
      authorType: 'provider',
      authorProviderId: provider._id,
    });
    const { responseJson, mockResponse } = makeMockResponse();

    await getBlogPostBySlug(
      { params: { slug: post.slug } } as unknown as Request,
      mockResponse
    );

    const result = responseJson.mock.calls[0][0];
    expect(result.authorSummary).toBeDefined();
    expect(result.authorSummary.displayName).toBe(provider.displayName);
    expect(result.authorSummary.type).toBe(provider.type);
    expect(result.authorSummary.id).toBe(provider._id.toString());
  });

  it('omits sensitive provider fields from authorSummary', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await makePublishedPost({
      authorType: 'provider',
      authorProviderId: provider._id,
    });
    const { responseJson, mockResponse } = makeMockResponse();

    await getBlogPostBySlug(
      { params: { slug: post.slug } } as unknown as Request,
      mockResponse
    );

    const summary = responseJson.mock.calls[0][0].authorSummary;
    expect(summary.userId).toBeUndefined();
    expect(summary.contactEmail).toBeUndefined();
    expect(summary.payfastPaymentId).toBeUndefined();
    expect(summary.profileImagePublicId).toBeUndefined();
    expect(summary.subscriptionEndsAt).toBeUndefined();
    expect(summary.trialEndsAt).toBeUndefined();
  });

  it('omits authorSummary for admin-authored posts', async () => {
    const post = await makePublishedPost({ authorType: 'admin' });
    const { responseJson, mockResponse } = makeMockResponse();

    await getBlogPostBySlug(
      { params: { slug: post.slug } } as unknown as Request,
      mockResponse
    );

    const result = responseJson.mock.calls[0][0];
    expect(result.authorSummary).toBeUndefined();
  });

  it('omits authorSummary when provider is not approved', async () => {
    const user = await createTestUser();
    const provider = await Provider.create({
      userId: user._id.toString(),
      type: 'psychologist',
      displayName: 'Pending Provider',
      bio: 'A bio long enough to pass validation for testing purposes here.',
      degrees: ['MA Psychology'],
      professionalBodies: [{ body: 'HPCSA', registrationNumber: 'PS 0000001' }],
      certifications: [],
      specialties: ['Anxiety & Stress'],
      pricing: { individualCounsellingRate: 700, offersIntroductoryConsultation: false },
      location: {
        type: 'physical',
        province: 'western-cape',
        provinceDisplay: 'Western Cape',
        city: 'cape-town',
        cityDisplay: 'Cape Town',
        fullLocation: 'Cape Town, Western Cape',
        shortLocation: 'Cape Town',
      },
      sessionFormats: { inPerson: true, online: false },
      contactEmail: 'pending@example.com',
      isPublished: false,
      vettingStatus: 'pending',
      subscriptionStatus: 'none',
    });
    const post = await makePublishedPost({
      authorType: 'provider',
      authorProviderId: provider._id,
    });
    const { responseJson, mockResponse } = makeMockResponse();

    await getBlogPostBySlug(
      { params: { slug: post.slug } } as unknown as Request,
      mockResponse
    );

    const result = responseJson.mock.calls[0][0];
    expect(result.authorSummary).toBeUndefined();
  });

  it('omits authorSummary when provider profile is unpublished', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({
      userId: user._id.toString(),
      isPublished: false,
    });
    const post = await makePublishedPost({
      authorType: 'provider',
      authorProviderId: provider._id,
    });
    const { responseJson, mockResponse } = makeMockResponse();

    await getBlogPostBySlug(
      { params: { slug: post.slug } } as unknown as Request,
      mockResponse
    );

    const result = responseJson.mock.calls[0][0];
    expect(result.authorSummary).toBeUndefined();
  });

  it('omits authorSummary when authorProviderId references a deleted provider', async () => {
    const deletedId = new mongoose.Types.ObjectId();
    const post = await makePublishedPost({
      authorType: 'provider',
      authorProviderId: deletedId,
    });
    const { responseJson, mockResponse } = makeMockResponse();

    await getBlogPostBySlug(
      { params: { slug: post.slug } } as unknown as Request,
      mockResponse
    );

    const result = responseJson.mock.calls[0][0];
    expect(result.authorSummary).toBeUndefined();
  });

  it('returns 404 for unpublished posts', async () => {
    const post = await makePublishedPost({ status: 'draft' });
    const { responseStatus, mockResponse } = makeMockResponse();

    await getBlogPostBySlug(
      { params: { slug: post.slug } } as unknown as Request,
      mockResponse
    );

    expect(responseStatus).toHaveBeenCalledWith(404);
  });
});
