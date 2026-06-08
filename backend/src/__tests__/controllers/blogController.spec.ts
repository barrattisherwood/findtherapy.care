import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import BlogPost from '../../models/BlogPost';
import { createBlogPost, updateBlogPost } from '../../controllers/blogController';
import { createTestUser } from '../fixtures/users';

const makePost = async (userId: string, overrides: Record<string, unknown> = {}) =>
  BlogPost.create({
    title: `Test Post ${Date.now()}`,
    slug: `test-post-${Date.now()}`,
    content: 'Content',
    excerpt: 'Excerpt',
    author: userId,
    categories: [],
    tags: [],
    ...overrides,
  });

const makeMockResponse = () => {
  const responseJson = jest.fn();
  const responseStatus = jest.fn().mockReturnThis();
  const mockResponse = {
    json: responseJson,
    status: responseStatus,
  } as unknown as Response;
  return { responseJson, responseStatus, mockResponse };
};

describe('Blog Controller - authorDisplayName', () => {
  describe('createBlogPost', () => {
    it('saves authorDisplayName when provided', async () => {
      const user = await createTestUser();
      const { responseJson, mockResponse } = makeMockResponse();

      const mockRequest = {
        userId: user._id.toString(),
        body: {
          title: 'Post With Custom Author',
          content: 'Some content here',
          excerpt: 'Short excerpt',
          categories: [],
          tags: [],
          authorDisplayName: 'Dr. Smith',
        },
      } as unknown as AuthRequest;

      await createBlogPost(mockRequest, mockResponse);

      expect(responseJson).toHaveBeenCalled();
      const savedPost = responseJson.mock.calls[0][0];
      expect(savedPost.authorDisplayName).toBe('Dr. Smith');
    });

    it('allows omitting authorDisplayName', async () => {
      const user = await createTestUser();
      const { responseJson, mockResponse } = makeMockResponse();

      const mockRequest = {
        userId: user._id.toString(),
        body: {
          title: 'Post Without Author Name',
          content: 'Some content here',
          excerpt: 'Short excerpt',
          categories: [],
          tags: [],
        },
      } as unknown as AuthRequest;

      await createBlogPost(mockRequest, mockResponse);

      expect(responseJson).toHaveBeenCalled();
      const savedPost = responseJson.mock.calls[0][0];
      expect(savedPost.authorDisplayName).toBeUndefined();
    });

    it('sets author to the authenticated user id', async () => {
      const user = await createTestUser();
      const { responseJson, mockResponse } = makeMockResponse();

      const mockRequest = {
        userId: user._id.toString(),
        body: {
          title: 'Author Assignment Test',
          content: 'Content',
          excerpt: 'Excerpt',
          categories: [],
          tags: [],
        },
      } as unknown as AuthRequest;

      await createBlogPost(mockRequest, mockResponse);

      const savedPost = responseJson.mock.calls[0][0];
      expect(savedPost.author._id.toString()).toBe(user._id.toString());
    });
  });

  describe('updateBlogPost', () => {
    it('updates authorDisplayName', async () => {
      const user = await createTestUser();
      const { responseJson, mockResponse } = makeMockResponse();

      const blogPost = await BlogPost.create({
        title: 'Existing Post',
        slug: 'existing-post',
        content: 'Content',
        excerpt: 'Excerpt',
        author: user._id,
        authorDisplayName: 'Old Name',
        categories: [],
        tags: [],
      });

      const mockRequest = {
        userId: user._id.toString(),
        params: { id: blogPost._id.toString() },
        body: { authorDisplayName: 'New Name' },
      } as unknown as AuthRequest;

      await updateBlogPost(mockRequest, mockResponse);

      expect(responseJson).toHaveBeenCalled();
      const updatedPost = responseJson.mock.calls[0][0];
      expect(updatedPost.authorDisplayName).toBe('New Name');
    });

    it('clears authorDisplayName when set to empty string', async () => {
      const user = await createTestUser();
      const { responseJson, mockResponse } = makeMockResponse();

      const blogPost = await BlogPost.create({
        title: 'Post To Clear Author',
        slug: 'post-to-clear-author',
        content: 'Content',
        excerpt: 'Excerpt',
        author: user._id,
        authorDisplayName: 'Previous Name',
        categories: [],
        tags: [],
      });

      const mockRequest = {
        userId: user._id.toString(),
        params: { id: blogPost._id.toString() },
        body: { authorDisplayName: '' },
      } as unknown as AuthRequest;

      await updateBlogPost(mockRequest, mockResponse);

      expect(responseJson).toHaveBeenCalled();
      const updatedPost = responseJson.mock.calls[0][0];
      expect(updatedPost.authorDisplayName).toBe('');
    });

    it('updates featuredImage url', async () => {
      const user = await createTestUser();
      const { responseJson, mockResponse } = makeMockResponse();

      const post = await makePost(user._id.toString(), {
        featuredImage: 'https://old.example.com/cover.jpg',
      });

      const newUrl = 'https://res.cloudinary.com/demo/image/upload/blog/new.jpg';
      const mockRequest = {
        userId: user._id.toString(),
        params: { id: post._id.toString() },
        body: { featuredImage: newUrl },
      } as unknown as AuthRequest;

      await updateBlogPost(mockRequest, mockResponse);

      expect(responseJson).toHaveBeenCalled();
      const updated = responseJson.mock.calls[0][0];
      expect(updated.featuredImage).toBe(newUrl);
    });

    it('clears featuredImage when set to empty string', async () => {
      const user = await createTestUser();
      const { responseJson, mockResponse } = makeMockResponse();

      const post = await makePost(user._id.toString(), {
        featuredImage: 'https://existing.example.com/cover.jpg',
      });

      const mockRequest = {
        userId: user._id.toString(),
        params: { id: post._id.toString() },
        body: { featuredImage: '' },
      } as unknown as AuthRequest;

      await updateBlogPost(mockRequest, mockResponse);

      expect(responseJson).toHaveBeenCalled();
      const updated = responseJson.mock.calls[0][0];
      expect(updated.featuredImage).toBe('');
    });

    it('returns 404 for a non-existent post id', async () => {
      const user = await createTestUser();
      const { responseJson, responseStatus, mockResponse } = makeMockResponse();

      const mockRequest = {
        userId: user._id.toString(),
        params: { id: '000000000000000000000000' },
        body: { authorDisplayName: 'New Name' },
      } as unknown as AuthRequest;

      await updateBlogPost(mockRequest, mockResponse);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({ message: 'Blog post not found' }));
    });
  });
});
