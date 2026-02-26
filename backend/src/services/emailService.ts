import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@findtherapy.care';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@findtherapy.care';
const APP_URL = process.env.APP_URL || 'http://localhost:4200';

// ===========================================
// Provider Vetting Emails
// ===========================================

/**
 * Notify admin that a new provider has registered and is pending vetting.
 */
export const sendNewProviderPendingEmail = async (
  providerName: string,
  providerEmail: string,
  providerType: string
): Promise<void> => {
  const vettingUrl = `${APP_URL}/admin/vetting`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== NEW PROVIDER PENDING ==========');
    console.log(`Provider: ${providerName} (${providerEmail})`);
    console.log(`Type: ${providerType}`);
    console.log(`Vetting URL: ${vettingUrl}`);
    console.log('==========================================\n');
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `New Provider Pending Review - ${providerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Provider Registration</h2>
        <p>A new provider has registered and is waiting for your review.</p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Name:</strong> ${providerName}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${providerEmail}</p>
          <p style="margin: 4px 0;"><strong>Type:</strong> ${providerType}</p>
        </div>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${vettingUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 8px; display: inline-block;
                    font-weight: 600;">
            Review Provider
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">findtherapy.care admin notification</p>
      </div>
    `,
    text: `New Provider Registration\n\nA new provider has registered and is waiting for review.\n\nName: ${providerName}\nEmail: ${providerEmail}\nType: ${providerType}\n\nReview at: ${vettingUrl}`,
  });

  console.log('✅ New provider pending email sent to admin:', result);
};

/**
 * Notify provider that their profile has been approved.
 */
export const sendVettingApprovedEmail = async (
  email: string,
  displayName: string
): Promise<void> => {
  const profileUrl = `${APP_URL}/provider-profile`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== VETTING APPROVED ==========');
    console.log(`Provider: ${displayName} (${email})`);
    console.log('======================================\n');
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: email,
    subject: 'Your Profile Has Been Approved! - findtherapy.care',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Your Profile Has Been Approved!</h2>
        <p>Hello ${displayName},</p>
        <p>Great news! Your profile on findtherapy.care has been reviewed and <strong>approved</strong>. Your profile is now live and visible to care seekers across South Africa.</p>

        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #166534;">
            <strong>Your free trial has started.</strong> Take this time to make sure your profile is complete and stands out to potential clients.
          </p>
        </div>

        <h3 style="color: #374151; margin-top: 30px;">Next steps:</h3>
        <ul style="color: #4b5563; line-height: 1.8;">
          <li>Review your profile to make sure everything looks great</li>
          <li>Add a professional profile photo if you haven't already</li>
          <li>Share your findtherapy.care profile link with your network</li>
        </ul>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${profileUrl}"
             style="background-color: #16a34a; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 8px; display: inline-block;
                    font-weight: 600;">
            View My Profile
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Thank you for joining findtherapy.care. If you have any questions, simply reply to this email.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          findtherapy.care - Connecting care seekers with mental health professionals across South Africa
        </p>
      </div>
    `,
    text: `Your Profile Has Been Approved!\n\nHello ${displayName},\n\nGreat news! Your profile on findtherapy.care has been reviewed and approved. Your profile is now live and visible to care seekers.\n\nYour free trial has started. Take this time to make sure your profile is complete.\n\nNext steps:\n- Review your profile\n- Add a professional profile photo\n- Share your profile link\n\nView your profile: ${profileUrl}\n\nThank you for joining findtherapy.care.`,
  });

  console.log('✅ Vetting approved email sent:', result);
};

/**
 * Notify provider that their profile has been rejected.
 */
export const sendVettingRejectedEmail = async (
  email: string,
  displayName: string,
  notes?: string
): Promise<void> => {
  const profileUrl = `${APP_URL}/provider-profile`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== VETTING REJECTED ==========');
    console.log(`Provider: ${displayName} (${email})`);
    console.log(`Notes: ${notes || '(none)'}`);
    console.log('======================================\n');
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const notesSection = notes
    ? `<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #991b1b; font-weight: 600;">Reviewer notes:</p>
          <p style="margin: 0; color: #991b1b;">${notes}</p>
        </div>`
    : '';

  const notesText = notes ? `\nReviewer notes: ${notes}\n` : '';

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: email,
    subject: 'Profile Review Update - findtherapy.care',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Profile Review Update</h2>
        <p>Hello ${displayName},</p>
        <p>Thank you for registering on findtherapy.care. After reviewing your profile, we were unable to approve it at this time.</p>

        ${notesSection}

        <p>Please review the feedback above and update your profile details. Once updated, your profile will be resubmitted for review automatically.</p>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${profileUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 8px; display: inline-block;
                    font-weight: 600;">
            Update My Profile
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          If you believe this decision was made in error, or if you have any questions, please reply to this email.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          findtherapy.care - Connecting care seekers with mental health professionals across South Africa
        </p>
      </div>
    `,
    text: `Profile Review Update\n\nHello ${displayName},\n\nThank you for registering on findtherapy.care. After reviewing your profile, we were unable to approve it at this time.\n${notesText}\nPlease review the feedback and update your profile details. Once updated, your profile will be resubmitted for review automatically.\n\nUpdate your profile: ${profileUrl}\n\nIf you believe this decision was made in error, please reply to this email.`,
  });

  console.log('✅ Vetting rejected email sent:', result);
};

export const sendEmailVerificationEmail = async (
  email: string,
  verificationToken: string
): Promise<void> => {
  const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== EMAIL VERIFICATION ==========');
    console.log(`Email: ${email}`);
    console.log(`Verify URL: ${verifyUrl}`);
    console.log('========================================\n');
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: email,
    subject: 'Verify Your Email Address - findtherapy.care',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verify Your Email Address</h2>
        <p>Thanks for registering on findtherapy.care. Please verify your email address to submit your profile for review.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verifyUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 8px; display: inline-block;
                    font-weight: 600;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">findtherapy.care admin notification</p>
      </div>
    `,
    text: `Verify Your Email Address\n\nThanks for registering on findtherapy.care. Please verify your email address to submit your profile for review.\n\nVerify here: ${verifyUrl}\n\nThis link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.`,
  });

  console.log('✅ Email verification sent:', result);
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  // Log reset link in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== PASSWORD RESET ==========');
    console.log(`Email: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('=====================================\n');
  }

  // Skip actual email send if API key not configured
  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: email,
    subject: 'Reset Your Password - findtherapy.care',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>You requested to reset your password for your findtherapy.care account.</p>
        <p>Click the button below to set a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 8px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          findtherapy.care - Find local care providers
        </p>
      </div>
    `,
    text: `
      Reset Your Password

      You requested to reset your password for your findtherapy.care account.

      Click this link to set a new password: ${resetUrl}

      This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
    `,
  });

  console.log('✅ Password reset email sent successfully:', result);
};

export const sendTrialEndingReminderEmail = async (
  email: string,
  displayName: string,
  trialEndsAt: Date
): Promise<void> => {
  const daysRemaining = Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const subscribeUrl = `${APP_URL}/provider-profile`;

  // Log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== TRIAL ENDING REMINDER ==========');
    console.log(`Provider: ${displayName} (${email})`);
    console.log(`Days Remaining: ${daysRemaining}`);
    console.log(`Subscribe URL: ${subscribeUrl}`);
    console.log('==========================================\n');
  }

  // Skip actual email send if API key not configured
  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: email,
    subject: 'Your Trial is Ending Soon - findtherapy.care',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Your Trial is Ending Soon</h2>
        <p>Hello ${displayName},</p>
        <p>This is a friendly reminder that your free trial on findtherapy.care will end in <strong>${daysRemaining} days</strong>.</p>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Trial ends:</strong> ${trialEndsAt.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <p>To continue enjoying the benefits of being listed on our platform and connecting with clients seeking mental health support, please subscribe to one of our plans.</p>
        
        <h3 style="color: #374151; margin-top: 30px;">Benefits of subscribing:</h3>
        <ul style="color: #4b5563; line-height: 1.8;">
          <li>Maintain your profile visibility to thousands of care seekers</li>
          <li>Receive direct inquiries from potential clients</li>
          <li>Manage your profile and availability</li>
          <li>Access to platform analytics and insights</li>
        </ul>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${subscribeUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 8px; display: inline-block;
                    font-weight: 600;">
            Subscribe Now
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          Have questions? Feel free to reply to this email and we'll be happy to help.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          findtherapy.care - Connecting care seekers with mental health professionals across South Africa
        </p>
      </div>
    `,
    text: `
      Your Trial is Ending Soon

      Hello ${displayName},

      This is a friendly reminder that your free trial on findtherapy.care will end in ${daysRemaining} days.

      Trial ends: ${trialEndsAt.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

      To continue enjoying the benefits of being listed on our platform and connecting with clients seeking mental health support, please subscribe to one of our plans.

      Benefits of subscribing:
      - Maintain your profile visibility to thousands of care seekers
      - Receive direct inquiries from potential clients
      - Manage your profile and availability
      - Access to platform analytics and insights

      Subscribe now: ${subscribeUrl}

      Have questions? Feel free to reply to this email and we'll be happy to help.

      findtherapy.care - Connecting care seekers with mental health professionals across South Africa
    `,
  });

  console.log('✅ Trial ending reminder email sent successfully:', result);
};
