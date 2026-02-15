import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@findtherapy.care';
const APP_URL = process.env.APP_URL || 'http://localhost:4200';

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

export const sendContactNotificationEmail = async (
  providerEmail: string,
  providerName: string,
  contactName: string,
  contactEmail: string,
  contactPhone: string | undefined,
  message: string
): Promise<void> => {
  // Log contact in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== CONTACT NOTIFICATION ==========');
    console.log(`Provider: ${providerName} (${providerEmail})`);
    console.log(`From: ${contactName} (${contactEmail})`);
    console.log(`Phone: ${contactPhone || 'Not provided'}`);
    console.log(`Message: ${message}`);
    console.log('==========================================\n');
  }

  // Skip actual email send if API key not configured
  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: providerEmail,
    replyTo: contactEmail,
    subject: `New Inquiry from ${contactName} - findtherapy.care`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Inquiry</h2>
        <p>Hello ${providerName},</p>
        <p>You have received a new inquiry through findtherapy.care.</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${contactName}</p>
          <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${contactEmail}">${contactEmail}</a></p>
          ${contactPhone ? `<p style="margin: 0 0 10px 0;"><strong>Phone:</strong> ${contactPhone}</p>` : ''}
          <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
          <p style="margin: 0;"><strong>Message:</strong></p>
          <p style="margin: 10px 0 0 0; white-space: pre-line;">${message}</p>
        </div>

        <p>You can reply directly to this email to respond to ${contactName}.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          findtherapy.care - Connecting care seekers with mental health professionals
        </p>
      </div>
    `,
    text: `
      New Inquiry

      Hello ${providerName},

      You have received a new inquiry through findtherapy.care.

      From: ${contactName}
      Email: ${contactEmail}
      ${contactPhone ? `Phone: ${contactPhone}` : ''}

      Message:
      ${message}

      You can reply directly to this email to respond to ${contactName}.
    `,
  });

  console.log('✅ Contact notification email sent successfully:', result);
};

export const sendSiteContactEmail = async (
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<void> => {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'b4rr4tt@gmail.com';

  // Log contact in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== SITE CONTACT FORM ==========');
    console.log(`From: ${name} (${email})`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log('========================================\n');
  }

  // Skip actual email send if API key not configured
  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `Site Contact: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Site Contact Form Submission</h2>
        <p>You have received a new message through the findtherapy.care contact form.</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${name}</p>
          <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
          <p style="margin: 0;"><strong>Message:</strong></p>
          <p style="margin: 10px 0 0 0; white-space: pre-line;">${message}</p>
        </div>

        <p>You can reply directly to this email to respond to ${name}.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          findtherapy.care - Site Contact Form
        </p>
      </div>
    `,
    text: `
      Site Contact Form Submission

      You have received a new message through the findtherapy.care contact form.

      From: ${name}
      Email: ${email}
      Subject: ${subject}

      Message:
      ${message}

      You can reply directly to this email to respond to ${name}.
    `,
  });

  console.log('✅ Site contact email sent successfully:', result);
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
