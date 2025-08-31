import * as postmark from 'postmark'

if (!process.env.POSTMARK_SERVER_TOKEN) {
  throw new Error('POSTMARK_SERVER_TOKEN environment variable is required')
}

export const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN)

export interface EmailOptions {
  to: string
  subject: string
  htmlBody?: string
  textBody?: string
  from?: string
  replyTo?: string
  cc?: string
  bcc?: string
  tag?: string
  metadata?: Record<string, string>
  headers?: postmark.Header[]
  templateId?: number
  templateModel?: Record<string, any>
}

export class PostmarkEmailService {
  private defaultFrom: string

  constructor(defaultFrom = 'noreply@yourdomain.com') {
    this.defaultFrom = defaultFrom
  }

  async sendEmail(options: EmailOptions) {
    try {
      const emailData: postmark.Message = {
        From: options.from || this.defaultFrom,
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.htmlBody,
        TextBody: options.textBody,
        ReplyTo: options.replyTo,
        Cc: options.cc,
        Bcc: options.bcc,
        Tag: options.tag,
        Metadata: options.metadata,
        Headers: options.headers,
      }

      const result = await client.sendEmail(emailData)
      return { success: true, data: result }
    } catch (error) {
      console.error('Failed to send email:', error)
      return { success: false, error: error as Error }
    }
  }

  async sendEmailWithTemplate(options: EmailOptions & { templateId: number; templateModel: Record<string, any> }) {
    try {
      const emailData: postmark.TemplatedMessage = {
        From: options.from || this.defaultFrom,
        To: options.to,
        TemplateId: options.templateId,
        TemplateModel: options.templateModel,
        ReplyTo: options.replyTo,
        Cc: options.cc,
        Bcc: options.bcc,
        Tag: options.tag,
        Metadata: options.metadata,
        Headers: options.headers,
      }

      const result = await client.sendEmailWithTemplate(emailData)
      return { success: true, data: result }
    } catch (error) {
      console.error('Failed to send templated email:', error)
      return { success: false, error: error as Error }
    }
  }

  async sendBulkEmails(emails: EmailOptions[]) {
    try {
      const emailData: postmark.Message[] = emails.map(options => ({
        From: options.from || this.defaultFrom,
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.htmlBody,
        TextBody: options.textBody,
        ReplyTo: options.replyTo,
        Cc: options.cc,
        Bcc: options.bcc,
        Tag: options.tag,
        Metadata: options.metadata,
        Headers: options.headers,
      }))

      const result = await client.sendEmailBatch(emailData)
      return { success: true, data: result }
    } catch (error) {
      console.error('Failed to send bulk emails:', error)
      return { success: false, error: error as Error }
    }
  }

  // Convenience methods for common email types
  async sendWelcomeEmail(to: string, userName: string) {
    return this.sendEmail({
      to,
      subject: 'Welcome to our platform!',
      htmlBody: `
        <h1>Welcome, ${userName}!</h1>
        <p>Thank you for joining our platform. We're excited to have you on board.</p>
        <p>Get started by exploring our features and building your first project.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Team</p>
      `,
      textBody: `Welcome, ${userName}! Thank you for joining our platform. We're excited to have you on board.`,
      tag: 'welcome',
    })
  }

  async sendPasswordResetEmail(to: string, resetLink: string) {
    return this.sendEmail({
      to,
      subject: 'Reset your password',
      htmlBody: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
      `,
      textBody: `Password reset requested. Visit this link to reset your password: ${resetLink}`,
      tag: 'password-reset',
    })
  }

  async sendVerificationEmail(to: string, verificationLink: string) {
    return this.sendEmail({
      to,
      subject: 'Verify your email address',
      htmlBody: `
        <h1>Email Verification</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
      `,
      textBody: `Please verify your email address by visiting: ${verificationLink}`,
      tag: 'verification',
    })
  }

  async sendNotificationEmail(to: string, title: string, message: string) {
    return this.sendEmail({
      to,
      subject: title,
      htmlBody: `
        <h1>${title}</h1>
        <p>${message}</p>
        <p>Best regards,<br>The Team</p>
      `,
      textBody: `${title}\n\n${message}`,
      tag: 'notification',
    })
  }

  // Analytics and tracking methods
  async getDeliveryStats() {
    try {
      const stats = await client.getDeliveryStats()
      return { success: true, data: stats }
    } catch (error) {
      console.error('Failed to get delivery stats:', error)
      return { success: false, error: error as Error }
    }
  }

  async getBounces(options?: { count?: number; offset?: number }) {
    try {
      const bounces = await client.getBounces(options?.count, options?.offset)
      return { success: true, data: bounces }
    } catch (error) {
      console.error('Failed to get bounces:', error)
      return { success: false, error: error as Error }
    }
  }

  async getOutboundMessages(options?: { count?: number; offset?: number }) {
    try {
      const messages = await client.getOutboundMessages(options?.count, options?.offset)
      return { success: true, data: messages }
    } catch (error) {
      console.error('Failed to get outbound messages:', error)
      return { success: false, error: error as Error }
    }
  }
}

// Export default instance
export const emailService = new PostmarkEmailService()