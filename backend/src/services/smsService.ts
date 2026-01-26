// SMS Service using Twilio
// Alternative SA providers: BulkSMS, Clickatell, SMSPortal

interface SMSConfig {
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
}

const config: SMSConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_PHONE_NUMBER,
};

const isSMSConfigured = (): boolean => {
  return !!(config.accountSid && config.authToken && config.fromNumber);
};

export const sendContactNotificationSMS = async (
  providerPhone: string,
  providerName: string,
  contactName: string
): Promise<void> => {
  // Log SMS notification
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========== SMS NOTIFICATION ==========');
    console.log(`To: ${providerPhone}`);
    console.log(`Message: New inquiry from ${contactName} on findtherapy.care. Check your email for details.`);
    console.log('======================================\n');
  }

  // Skip SMS if not configured
  if (!isSMSConfigured()) {
    console.log('(SMS send skipped - Twilio not configured)');
    console.log('To enable SMS: Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
    return;
  }

  try {
    // Dynamic import of Twilio SDK (only load if configured)
    const twilio = await import('twilio');
    const client = twilio.default(config.accountSid!, config.authToken!);

    const message = `Hi ${providerName}, you have a new inquiry from ${contactName} on findtherapy.care. Check your email for details.`;

    await client.messages.create({
      body: message,
      from: config.fromNumber!,
      to: providerPhone,
    });

    console.log(`SMS sent successfully to ${providerPhone}`);
  } catch (error: any) {
    console.error('SMS send error:', error.message);
    // Don't throw - we don't want to fail the contact request if SMS fails
  }
};
