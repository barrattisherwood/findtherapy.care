import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

  // Skip actual email send in development if SMTP not configured
  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_USER) {
    console.log('(Email send skipped - SMTP not configured)');
    return;
  }

  const mailOptions = {
    from: `"findtherapy.care" <${FROM_EMAIL}>`,
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
  };

  await transporter.sendMail(mailOptions);
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

  // Skip actual email send in development if SMTP not configured
  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_USER) {
    console.log('(Email send skipped - SMTP not configured)');
    return;
  }

  const mailOptions = {
    from: `"findtherapy.care" <${FROM_EMAIL}>`,
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
  };

  await transporter.sendMail(mailOptions);
};
