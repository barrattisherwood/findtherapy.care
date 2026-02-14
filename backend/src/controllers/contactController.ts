import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Provider } from '../models/Provider';
import { ContactProviderRequest } from '@findlocal/shared';
import { sendContactNotificationEmail, sendSiteContactEmail } from '../services/emailService';
import { sendContactNotificationSMS } from '../services/smsService';

// Contact a provider (public endpoint - no auth required)
export const contactProvider = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: ContactProviderRequest = req.body;

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate message length
    if (data.message.length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters' });
    }

    if (data.message.length > 2000) {
      return res.status(400).json({ message: 'Message must not exceed 2000 characters' });
    }

    // Find the provider
    const provider = await Provider.findById(id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Check if provider is published and has active access
    if (!provider.isPublished) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const now = new Date();
    const hasAccess =
      provider.subscriptionStatus === 'active' ||
      (provider.trialEndsAt && new Date(provider.trialEndsAt) > now);

    if (!hasAccess) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Send email notification
    try {
      await sendContactNotificationEmail(
        provider.contactEmail,
        provider.displayName,
        data.name,
        data.email,
        data.phone,
        data.message
      );
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return res.status(500).json({ message: 'Failed to send contact notification' });
    }

    // Send SMS notification if phone number is available
    if (provider.contactPhone) {
      try {
        await sendContactNotificationSMS(
          provider.contactPhone,
          provider.displayName,
          data.name
        );
      } catch (error) {
        console.error('Failed to send SMS notification:', error);
        // Don't fail the request if SMS fails
      }
    }

    res.json({
      success: true,
      message: 'Your message has been sent successfully',
    });
  } catch (error: any) {
    console.error('Contact provider error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Site contact form (public endpoint - no auth required)
export const contactSite = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate message length
    if (message.length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message must not exceed 2000 characters' });
    }

    // Send email notification to admin
    try {
      await sendSiteContactEmail(name, email, subject, message);
    } catch (error) {
      console.error('Failed to send site contact email:', error);
      return res.status(500).json({ message: 'Failed to send message' });
    }

    res.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
    });
  } catch (error: any) {
    console.error('Site contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
