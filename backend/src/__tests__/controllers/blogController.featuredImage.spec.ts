import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { uploadFeaturedImage } from '../../controllers/blogController';
import * as cloudinaryService from '../../services/cloudinaryService';

jest.mock('../../services/cloudinaryService');

const makeMockResponse = () => {
  const responseJson = jest.fn();
  const responseStatus = jest.fn().mockReturnThis();
  const mockResponse = {
    json: responseJson,
    status: responseStatus,
  } as unknown as Response;
  return { responseJson, responseStatus, mockResponse };
};

describe('uploadFeaturedImage', () => {
  it('returns 400 when no file is provided', async () => {
    const { responseJson, responseStatus, mockResponse } = makeMockResponse();
    const mockRequest = { userId: 'admin-id' } as unknown as AuthRequest;

    await uploadFeaturedImage(mockRequest, mockResponse);

    expect(responseStatus).toHaveBeenCalledWith(400);
    expect(responseJson).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No image file provided' })
    );
  });

  it('calls uploadBlogImage with the file buffer', async () => {
    const { mockResponse } = makeMockResponse();
    const fakeBuffer = Buffer.from('fake-image-data');
    const mockRequest = {
      userId: 'admin-id',
      file: { buffer: fakeBuffer, mimetype: 'image/jpeg', originalname: 'cover.jpg' },
    } as unknown as AuthRequest;

    jest.mocked(cloudinaryService.uploadBlogImage).mockResolvedValueOnce({
      url: 'https://res.cloudinary.com/demo/image/upload/blog/cover.jpg',
      publicId: 'blog/cover',
      width: 1200,
      height: 630,
    });

    await uploadFeaturedImage(mockRequest, mockResponse);

    expect(cloudinaryService.uploadBlogImage).toHaveBeenCalledWith(fakeBuffer, undefined);
  });

  it('returns { url } from the Cloudinary result', async () => {
    const { responseJson, mockResponse } = makeMockResponse();
    const mockRequest = {
      userId: 'admin-id',
      file: { buffer: Buffer.from('fake'), mimetype: 'image/jpeg', originalname: 'cover.jpg' },
    } as unknown as AuthRequest;

    const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/blog/abc123.jpg';
    jest.mocked(cloudinaryService.uploadBlogImage).mockResolvedValueOnce({
      url: cloudinaryUrl,
      publicId: 'blog/abc123',
      width: 1200,
      height: 630,
    });

    await uploadFeaturedImage(mockRequest, mockResponse);

    expect(responseJson).toHaveBeenCalledWith({ url: cloudinaryUrl });
  });

  it('returns 500 when Cloudinary upload throws', async () => {
    const { responseStatus, responseJson, mockResponse } = makeMockResponse();
    const mockRequest = {
      userId: 'admin-id',
      file: { buffer: Buffer.from('fake'), mimetype: 'image/jpeg', originalname: 'x.jpg' },
    } as unknown as AuthRequest;

    jest.mocked(cloudinaryService.uploadBlogImage).mockRejectedValueOnce(
      new Error('Cloudinary network error')
    );

    await uploadFeaturedImage(mockRequest, mockResponse);

    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Failed to upload image' })
    );
  });
});
