import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@findtherapy.care';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@findtherapy.care';
const APP_URL = process.env.APP_URL || 'http://localhost:4200';

const LOGO_URL = 'https://www.findtherapy.care/assets/images/logo.png';

// Brand colours
const C_PRIMARY    = '#78866b'; // sage green
const C_PRIMARY_DK = '#5f6b54'; // sage green dark (hover)
const C_BG         = '#f4f5f3'; // primary-50
const C_CARD       = '#ffffff';
const C_TEXT       = '#33392f'; // primary-900
const C_MUTED      = '#6b7886'; // secondary-500
const C_BORDER     = '#d1d7cb'; // primary-200

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

function emailShell(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>findtherapy.care</title>
</head>
<body style="margin:0;padding:0;background-color:${C_BG};font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${C_BG};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="https://www.findtherapy.care" style="display:inline-block;">
                <img src="${LOGO_URL}" alt="findtherapy.care" height="40"
                     style="display:block;height:40px;width:auto;" />
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${C_CARD};border-radius:12px;border:1px solid ${C_BORDER};padding:40px 40px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${C_MUTED};line-height:1.6;">
                © ${new Date().getFullYear()} findtherapy.care &nbsp;·&nbsp;
                Connecting care seekers with mental health professionals across South Africa
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:${C_MUTED};">
                This email was sent from <a href="https://www.findtherapy.care" style="color:${C_PRIMARY};text-decoration:none;">findtherapy.care</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:32px auto;">
    <tr>
      <td align="center" style="border-radius:8px;background-color:${C_PRIMARY};">
        <a href="${href}"
           style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;
                  color:#ffffff;text-decoration:none;border-radius:8px;
                  background-color:${C_PRIMARY};letter-spacing:0.01em;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function divider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr><td style="border-top:1px solid ${C_BORDER};"></td></tr>
  </table>`;
}

function infoBox(bgColor: string, borderColor: string, content: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0"
          style="margin:20px 0;border-radius:8px;background-color:${bgColor};
                 border-left:4px solid ${borderColor};">
    <tr><td style="padding:14px 16px;font-size:14px;color:${C_TEXT};line-height:1.6;">
      ${content}
    </td></tr>
  </table>`;
}

// ---------------------------------------------------------------------------
// Provider Vetting Emails
// ---------------------------------------------------------------------------

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

  const html = emailShell(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C_TEXT};">
      New Provider Registration
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:${C_MUTED};line-height:1.6;">
      A new provider has registered and is waiting for your review.
    </p>

    ${infoBox('#f4f5f3', C_PRIMARY, `
      <strong style="display:block;margin-bottom:6px;color:${C_TEXT};">Provider Details</strong>
      <span style="color:${C_MUTED};">Name:</span> <strong>${providerName}</strong><br/>
      <span style="color:${C_MUTED};">Email:</span> ${providerEmail}<br/>
      <span style="color:${C_MUTED};">Type:</span> ${providerType}
    `)}

    ${ctaButton(vettingUrl, 'Review Provider')}

    ${divider()}
    <p style="margin:0;font-size:13px;color:${C_MUTED};text-align:center;">
      Visit <a href="${vettingUrl}" style="color:${C_PRIMARY};text-decoration:none;">${vettingUrl}</a> to manage provider applications.
    </p>
  `);

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `New Provider Pending Review — ${providerName}`,
    html,
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
  const profileUrl = `${APP_URL}/provider/profile`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== VETTING APPROVED ==========');
    console.log(`Provider: ${displayName} (${email})`);
    console.log('======================================\n');
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const html = emailShell(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C_TEXT};">
      Your Profile Has Been Approved 🎉
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:${C_MUTED};line-height:1.6;">
      Hello ${displayName}, your profile on findtherapy.care has been reviewed and approved.
      You're now live and visible to care seekers across South Africa.
    </p>

    ${infoBox('#f0fff4', '#38a169', `
      <strong>Your free trial has started.</strong><br/>
      Take this time to make sure your profile is complete and stands out to potential clients.
    `)}

    <h3 style="margin:24px 0 12px;font-size:16px;font-weight:600;color:${C_TEXT};">Next steps</h3>
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:6px 0;font-size:14px;color:${C_MUTED};">✓&nbsp;&nbsp;Review your profile to make sure everything looks great</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px;color:${C_MUTED};">✓&nbsp;&nbsp;Add a professional profile photo if you haven't already</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px;color:${C_MUTED};">✓&nbsp;&nbsp;Share your findtherapy.care profile link with your network</td>
      </tr>
    </table>

    ${ctaButton(profileUrl, 'View My Profile')}

    ${divider()}
    <p style="margin:0;font-size:13px;color:${C_MUTED};text-align:center;">
      Questions? Reply to this email and we'll be happy to help.
    </p>
  `);

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: email,
    subject: 'Your Profile Has Been Approved! — findtherapy.care',
    html,
    text: `Your Profile Has Been Approved!\n\nHello ${displayName},\n\nYour profile on findtherapy.care has been reviewed and approved. You're now live and visible to care seekers.\n\nYour free trial has started. Take this time to make sure your profile is complete.\n\nNext steps:\n- Review your profile\n- Add a professional profile photo\n- Share your profile link\n\nView your profile: ${profileUrl}\n\nThank you for joining findtherapy.care.`,
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
  const profileUrl = `${APP_URL}/provider/profile`;

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
    ? infoBox('#fff5f5', '#e53e3e', `<strong>Reviewer notes:</strong><br/>${notes}`)
    : '';

  const html = emailShell(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C_TEXT};">
      Profile Review Update
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:${C_MUTED};line-height:1.6;">
      Hello ${displayName}, thank you for registering on findtherapy.care.
      After reviewing your profile, we were unable to approve it at this time.
    </p>

    ${notesSection}

    <p style="margin:0 0 24px;font-size:15px;color:${C_TEXT};line-height:1.6;">
      Please review the feedback above and update your profile details.
      Once updated, your profile will be resubmitted for review automatically.
    </p>

    ${ctaButton(profileUrl, 'Update My Profile')}

    ${divider()}
    <p style="margin:0;font-size:13px;color:${C_MUTED};text-align:center;">
      If you believe this decision was made in error, simply reply to this email.
    </p>
  `);

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: email,
    subject: 'Profile Review Update — findtherapy.care',
    html,
    text: `Profile Review Update\n\nHello ${displayName},\n\nThank you for registering on findtherapy.care. After reviewing your profile, we were unable to approve it at this time.\n${notes ? `\nReviewer notes: ${notes}\n` : ''}\nPlease review the feedback and update your profile details.\n\nUpdate your profile: ${profileUrl}\n\nIf you believe this decision was made in error, please reply to this email.`,
  });

  console.log('✅ Vetting rejected email sent:', result);
};

// ---------------------------------------------------------------------------
// Auth Emails
// ---------------------------------------------------------------------------

export const sendEmailVerificationEmail = async (
  email: string,
  verificationToken: string
): Promise<void> => {
  const verifyUrl = `${APP_URL}/verify-email?token=${verificationToken}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== EMAIL VERIFICATION ==========');
    console.log(`Email: ${email}`);
    console.log(`Verify URL: ${verifyUrl}`);
    console.log('=========================================\n');
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const html = emailShell(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C_TEXT};">
      Verify your email address
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:${C_MUTED};line-height:1.6;">
      Thanks for signing up to findtherapy.care. One quick step — please verify
      your email address to activate your account.
    </p>

    ${ctaButton(verifyUrl, 'Verify Email Address')}

    ${divider()}

    <p style="margin:0 0 8px;font-size:13px;color:${C_MUTED};text-align:center;">
      Button not working? Copy and paste this link into your browser:
    </p>
    <p style="margin:0;font-size:12px;color:${C_PRIMARY};text-align:center;word-break:break-all;">
      <a href="${verifyUrl}" style="color:${C_PRIMARY};text-decoration:none;">${verifyUrl}</a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:${C_MUTED};text-align:center;">
      This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
  `);

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: email,
    subject: 'Verify your email — findtherapy.care',
    html,
    text: `Verify your email address\n\nThanks for signing up to findtherapy.care.\n\nPlease verify your email address by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours. If you didn't create an account, you can safely ignore this email.`,
  });

  console.log('✅ Email verification email sent:', result);
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== PASSWORD RESET ==========');
    console.log(`Email: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('=====================================\n');
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const html = emailShell(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C_TEXT};">
      Reset your password
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:${C_MUTED};line-height:1.6;">
      We received a request to reset your findtherapy.care password. Click the button
      below to choose a new one.
    </p>

    ${ctaButton(resetUrl, 'Reset Password')}

    ${divider()}

    <p style="margin:0 0 8px;font-size:13px;color:${C_MUTED};text-align:center;">
      Button not working? Copy and paste this link into your browser:
    </p>
    <p style="margin:0;font-size:12px;color:${C_PRIMARY};text-align:center;word-break:break-all;">
      <a href="${resetUrl}" style="color:${C_PRIMARY};text-decoration:none;">${resetUrl}</a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:${C_MUTED};text-align:center;">
      This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
  `);

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: email,
    subject: 'Reset your password — findtherapy.care',
    html,
    text: `Reset your password\n\nWe received a request to reset your findtherapy.care password.\n\nClick this link to set a new password:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
  });

  console.log('✅ Password reset email sent successfully:', result);
};

// ---------------------------------------------------------------------------
// Blog Post Emails
// ---------------------------------------------------------------------------

export const sendBlogPostPendingReviewEmail = async (
  postTitle: string,
  providerName: string,
  providerEmail: string
): Promise<void> => {
  const reviewUrl = `${APP_URL}/admin/blog/pending`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== BLOG POST PENDING REVIEW ==========');
    console.log(`Post: "${postTitle}"`);
    console.log(`Provider: ${providerName} (${providerEmail})`);
    console.log(`Review URL: ${reviewUrl}`);
    console.log('==============================================\n');
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const html = emailShell(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C_TEXT};">
      Blog Post Ready for Review
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:${C_MUTED};line-height:1.6;">
      A provider has submitted a blog post and it is awaiting your review before going live.
    </p>

    ${infoBox('#f4f5f3', C_PRIMARY, `
      <strong style="display:block;margin-bottom:6px;color:${C_TEXT};">Post Details</strong>
      <span style="color:${C_MUTED};">Title:</span> <strong>${postTitle}</strong><br/>
      <span style="color:${C_MUTED};">Author:</span> ${providerName}<br/>
      <span style="color:${C_MUTED};">Email:</span> ${providerEmail}
    `)}

    ${ctaButton(reviewUrl, 'Review Post')}

    ${divider()}
    <p style="margin:0;font-size:13px;color:${C_MUTED};text-align:center;">
      Visit <a href="${reviewUrl}" style="color:${C_PRIMARY};text-decoration:none;">the admin blog queue</a> to approve or reject this post.
    </p>
  `);

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `Blog Post Pending Review — "${postTitle}"`,
    html,
    text: `Blog Post Ready for Review\n\nA provider has submitted a blog post awaiting your review.\n\nTitle: "${postTitle}"\nAuthor: ${providerName} (${providerEmail})\n\nReview at: ${reviewUrl}`,
  });

  console.log('✅ Blog post pending review email sent to admin:', result);
};

// ---------------------------------------------------------------------------
// Subscription / Trial Emails
// ---------------------------------------------------------------------------

export const sendTrialEndingReminderEmail = async (
  email: string,
  displayName: string,
  trialEndsAt: Date
): Promise<void> => {
  const daysRemaining = Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const subscribeUrl = `${APP_URL}/provider/profile`;
  const trialEndFormatted = trialEndsAt.toLocaleDateString('en-ZA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== TRIAL ENDING REMINDER ==========');
    console.log(`Provider: ${displayName} (${email})`);
    console.log(`Days Remaining: ${daysRemaining}`);
    console.log('==========================================\n');
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('(Email send skipped - Resend API key not configured)');
    return;
  }

  const html = emailShell(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${C_TEXT};">
      Your trial is ending soon
    </h2>
    <p style="margin:0 0 24px;font-size:15px;color:${C_MUTED};line-height:1.6;">
      Hello ${displayName}, your free trial on findtherapy.care will end in
      <strong style="color:${C_TEXT};">${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}</strong>.
    </p>

    ${infoBox('#fffaf0', '#ed8936', `
      <strong>Trial ends:</strong> ${trialEndFormatted}
    `)}

    <p style="margin:0 0 16px;font-size:15px;color:${C_TEXT};line-height:1.6;">
      To keep your profile visible to care seekers and continue receiving direct enquiries,
      please subscribe to one of our plans before your trial ends.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px;">
      <tr>
        <td style="padding:6px 0;font-size:14px;color:${C_MUTED};">✓&nbsp;&nbsp;Maintain your profile visibility</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px;color:${C_MUTED};">✓&nbsp;&nbsp;Receive direct enquiries from potential clients</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px;color:${C_MUTED};">✓&nbsp;&nbsp;Manage your profile and availability</td>
      </tr>
    </table>

    ${ctaButton(subscribeUrl, 'Subscribe Now')}

    ${divider()}
    <p style="margin:0;font-size:13px;color:${C_MUTED};text-align:center;">
      Questions? Reply to this email and we'll be happy to help.
    </p>
  `);

  const result = await resend.emails.send({
    from: `findtherapy.care <${FROM_EMAIL}>`,
    to: email,
    subject: `Your trial ends in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} — findtherapy.care`,
    html,
    text: `Your trial is ending soon\n\nHello ${displayName},\n\nYour free trial on findtherapy.care will end in ${daysRemaining} days (${trialEndFormatted}).\n\nTo continue enjoying the benefits of being listed on our platform, please subscribe before your trial ends.\n\nSubscribe now: ${subscribeUrl}\n\nQuestions? Reply to this email.`,
  });

  console.log('✅ Trial ending reminder email sent successfully:', result);
};
