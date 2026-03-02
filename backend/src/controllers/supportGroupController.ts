import { Response } from 'express';
import { SupportGroup } from '../models/SupportGroup';
import { AuthRequest } from '../middleware/auth';
import {
  CreateSupportGroupRequest,
  UpdateSupportGroupRequest,
  SupportGroupSearchParams,
  SupportGroup as SupportGroupType,
} from '@findlocal/shared';

// Helper to transform support group document to response
const toSupportGroupResponse = (doc: any): SupportGroupType => ({
  id: doc._id.toString(),
  name: doc.name,
  description: doc.description,
  category: doc.category,
  meetingType: doc.meetingType,
  location: doc.location,
  meetingSchedule: doc.meetingSchedule,
  contactEmail: doc.contactEmail,
  contactPhone: doc.contactPhone,
  website: doc.website,
  isActive: doc.isActive,
  createdBy: doc.createdBy,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// Create support group (admin only)
export const createSupportGroup = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data: CreateSupportGroupRequest = req.body;

    // Validate required fields
    if (!data.name || !data.description || !data.category || !data.meetingType || !data.location?.city) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const supportGroup = await SupportGroup.create({
      name: data.name,
      description: data.description,
      category: data.category,
      meetingType: data.meetingType,
      location: data.location,
      meetingSchedule: data.meetingSchedule,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      website: data.website,
      isActive: true,
      createdBy: userId,
    });

    res.status(201).json({ supportGroup: toSupportGroupResponse(supportGroup) });
  } catch (error: any) {
    console.error('Create support group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update support group (admin only)
export const updateSupportGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateSupportGroupRequest = req.body;

    const supportGroup = await SupportGroup.findById(id);
    if (!supportGroup) {
      return res.status(404).json({ message: 'Support group not found' });
    }

    // Update fields
    if (data.name !== undefined) supportGroup.name = data.name;
    if (data.description !== undefined) supportGroup.description = data.description;
    if (data.category !== undefined) supportGroup.category = data.category;
    if (data.meetingType !== undefined) supportGroup.meetingType = data.meetingType;
    if (data.location !== undefined) supportGroup.location = data.location;
    if (data.meetingSchedule !== undefined) supportGroup.meetingSchedule = data.meetingSchedule;
    if (data.contactEmail !== undefined) supportGroup.contactEmail = data.contactEmail;
    if (data.contactPhone !== undefined) supportGroup.contactPhone = data.contactPhone;
    if (data.website !== undefined) supportGroup.website = data.website;
    if (data.isActive !== undefined) supportGroup.isActive = data.isActive;

    await supportGroup.save();

    res.json({ supportGroup: toSupportGroupResponse(supportGroup) });
  } catch (error: any) {
    console.error('Update support group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete support group (admin only)
export const deleteSupportGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const supportGroup = await SupportGroup.findByIdAndDelete(id);

    if (!supportGroup) {
      return res.status(404).json({ message: 'Support group not found' });
    }

    res.json({ message: 'Support group deleted' });
  } catch (error: any) {
    console.error('Delete support group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search/list support groups (public)
export const searchSupportGroups = async (req: AuthRequest, res: Response) => {
  try {
    const params: SupportGroupSearchParams = {
      query: req.query.query as string,
      category: req.query.category as string,
      city: req.query.city as string,
      meetingType: req.query.meetingType as any,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    };

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    // Build query - only show active groups
    const query: any = {
      isActive: true,
    };

    if (params.query) {
      const regex = new RegExp(params.query, 'i');
      query.$or = [{ name: regex }, { description: regex }];
    }
    if (params.category) {
      query.category = params.category;
    }
    if (params.city) {
      query['location.city'] = new RegExp(params.city, 'i');
    }
    if (params.meetingType) {
      query.meetingType = params.meetingType;
    }

    const [supportGroups, total] = await Promise.all([
      SupportGroup.find(query).skip(skip).limit(limit).sort({ name: 1 }),
      SupportGroup.countDocuments(query),
    ]);

    res.json({
      supportGroups: supportGroups.map(toSupportGroupResponse),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Search support groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get support group by ID (public)
export const getSupportGroupById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const supportGroup = await SupportGroup.findOne({
      _id: id,
      isActive: true,
    });

    if (!supportGroup) {
      return res.status(404).json({ message: 'Support group not found' });
    }

    res.json({ supportGroup: toSupportGroupResponse(supportGroup) });
  } catch (error: any) {
    console.error('Get support group by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
