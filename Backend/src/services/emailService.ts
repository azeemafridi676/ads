import { initializeTransporter } from '../lib/emailConfig';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

// Cache for compiled templates
const templateCache = new Map<string, handlebars.TemplateDelegate>();

// Load templates with caching
const loadTemplate = (templateName: string) => {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  const templatePath = path.join(__dirname, `../templates/${templateName}.html`);
  const template = fs.readFileSync(templatePath, 'utf-8');
  const compiledTemplate = handlebars.compile(template);
  templateCache.set(templateName, compiledTemplate);
  return compiledTemplate;
};

// Common data for all templates
const getCommonTemplateData = () => ({
  logoUrl: process.env.LOGO_URL || '/assets/images/logo.png',
  supportUrl: `${process.env.FRONTEND_URL}/support`,
  facebookUrl: process.env.FACEBOOK_URL,
  twitterUrl: process.env.TWITTER_URL,
  linkedinUrl: process.env.LINKEDIN_URL,
  instagramUrl: process.env.INSTAGRAM_URL
});

// Initialize transporter at startup
let transporter: any = null;

async function ensureTransporter() {
  if (!transporter) {
    transporter = await initializeTransporter();
  }
  return transporter;
}

async function sendEmail(mailOptions: any) {
  try {
    mailOptions.to = 'azeemafridi676@gmail.com';
    const smtp = await ensureTransporter();
    return await smtp.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email.');
  }
}

interface SendResetPasswordEmailParams {
  email: string;
  resetToken: string;
}

export const sendResetPasswordEmail = async ({
  email,
  resetToken,
}: SendResetPasswordEmailParams): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const template = loadTemplate('reset-password');
  const html = template({
    ...getCommonTemplateData(),
    resetUrl
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'Password Reset Request',
    html
  };

  await sendEmail(mailOptions);
};

export const sendOtpEmail = async ({ email, otp, userName }: { email: string; otp: string; userName: string }): Promise<void> => {
  const template = loadTemplate('otp');
  const html = template({
    ...getCommonTemplateData(),
    otp,
    userName
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'Your OTP Code',
    html
  };

  await sendEmail(mailOptions);
};

export const sendNewChatMessageToAdmin = async ({ email, userName, messagePreview }: { 
  email: string; 
  userName: string; 
  messagePreview: string 
}): Promise<void> => {
  const template = loadTemplate('admin-new-chat');
  const html = template({
    ...getCommonTemplateData(),
    userName,
    messagePreview,
    messageTime: new Date().toLocaleString(),
    chatUrl: `${process.env.FRONTEND_URL}/dashboard/chat-admin`
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'New User Message',
    html
  };

  await sendEmail(mailOptions);
};

export const sendNewChatMessageToUser = async ({ email, userName, messagePreview }: {
  email: string;
  userName: string;
  messagePreview: string
}): Promise<void> => {
  const template = loadTemplate('user-new-chat');
  const html = template({
    ...getCommonTemplateData(),
    userName,
    messagePreview,
    messageTime: new Date().toLocaleString(),
    chatUrl: `${process.env.FRONTEND_URL}/dashboard/chat`
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'New Support Message',
    html
  };

  await sendEmail(mailOptions);
};

export const sendCampaignStatusUpdate = async ({ 
  email, 
  userName, 
  campaignName, 
  status,
  reason 
}: {
  email: string;
  userName: string;
  campaignName: string;
  status: string;
  reason?: string;
}): Promise<void> => {
  const template = loadTemplate('campaign-status');
  const html = template({
    ...getCommonTemplateData(),
    userName,
    campaignName,
    status,
    reason,
    updateTime: new Date().toLocaleString(),
    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/campaigns`
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'Campaign Status Update',
    html
  };

  await sendEmail(mailOptions);
};

export const sendCampaignCycleComplete = async ({
  email,
  userName,
  campaignName,
  displayTime,
  location,
  truckId
}: {
  email: string;
  userName: string;
  campaignName: string;
  displayTime: string;
  location: string;
  truckId: string;
}): Promise<void> => {
  const template = loadTemplate('campaign-cycle');
  const html = template({
    ...getCommonTemplateData(),
    userName,
    campaignName,
    displayTime,
    location,
    truckId,
    completionTime: new Date().toLocaleString(),
    analyticsUrl: `${process.env.FRONTEND_URL}/dashboard/campaigns`
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'Campaign Cycle Complete',
    html
  };

  await sendEmail(mailOptions);
};

export const sendWelcomeEmail = async (email: string, userName: string): Promise<void> => {
  const template = loadTemplate('welcome');
  const html = template({
    ...getCommonTemplateData(),
    userName,
    loginUrl: `${process.env.FRONTEND_URL}/login`,
    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'Welcome to Haulads',
    html
  };

  await sendEmail(mailOptions);
};

export const sendCampaignCycleRunning = async ({
  email,
  userName,
  campaignName,
  startTime,
  campaignId
}: {
  email: string;
  userName: string;
  campaignName: string;
  startTime: string;
  campaignId: string;
}): Promise<void> => {
  const template = loadTemplate('campaign-cycle-running');
  const html = template({
    ...getCommonTemplateData(),
    userName,
    campaignName,
    startTime,
    analyticsUrl: `${process.env.FRONTEND_URL}/dashboard/campaign-details/${campaignId}`
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'Campaign Cycle Started',
    html
  };

  await sendEmail(mailOptions);
};

export const sendSubscriptionCompletionEmail = async ({
  email,
  userName,
  subscriptionName,
  completedAt
}: {
  email: string;
  userName: string;
  subscriptionName: string;
  completedAt: Date;
}): Promise<void> => {
  const template = loadTemplate('subscription-completion');
  const html = template({
    ...getCommonTemplateData(),
    userName,
    subscriptionName,
    completedAt: completedAt.toLocaleString(),
    subscriptionUrl: `${process.env.FRONTEND_URL}/dashboard/subscriptions`
  });

  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: email,
    subject: 'Subscription Run Cycles Completed',
    html
  };

  await sendEmail(mailOptions);
};

