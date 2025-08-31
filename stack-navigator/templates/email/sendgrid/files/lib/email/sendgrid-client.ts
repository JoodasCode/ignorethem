import sgMail from '@sendgrid/mail'
import sgClient from '@sendgrid/client'

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY environment variable is required')
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
sgClient.setApiKey(process.env.SENDGRID_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  templateId?: string
  dynamicTemplateData?: Record<string, any>
  categories?: string[]
  customArgs?: Record<string, string>
  headers?: Record<string, string>
  attachments?: Array<{
    content: string
    filename: string
    type?: string
    disposition?: string
  }>
}

export class SendGridEmailService {
  private defaultFrom: string

  constructor(defaultFrom = 'noreply@yourdomain.com') {
    this.defaultFrom = defaultFrom
  }

  async sendEmail(options: EmailOptions) {
    try {
      const msg: sgMail.MailDataRequired = {
        to: options.to,
        from: options.from || this.defaultFrom,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        templateId: options.templateId,
        dynamicTemplateData: options.dynamicTemplateData,
        categories: options.categories,
        customArgs: options.customArgs,
        headers: options.headers,
        attachments: options.attachments,
      }

      const result = await sgMail.send(msg)
      return { success: true, data: result }
    } catch (error) {
      console.error('Failed to send email:', error)
      return { success: false, error: error as Error }
    }
  }

  async sendBulkEmails(emails: EmailOptions[]) {
    try {
      const messages: sgMail.MailDataRequired[] = emails.map(options => ({
        to: options.to,
        from: options.from || this.defaultFrom,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        templateId: options.templateId,
        dynamicTemplateData: options.dynamicTemplateData,
        categories: options.categories,
        customArgs: options.customArgs,
        headers: options.headers,
        attachments: options.attachments,
      }))

      const result = await sgMail.send(messages)
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
      html: `
        <h1>Welcome, ${userName}!</h1>
        <p>Thank you for joining our platform. We're excited to have you on board.</p>
        <p>Get started by exploring our features and building your first project.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Team</p>
      `,
      text: `Welcome, ${userName}! Thank you for joining our platform. We're excited to have you on board.`,
      categories: ['welcome'],
    })
  }

  async sendPasswordResetEmail(to: string, resetLink: string) {
    return this.sendEmail({
      to,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
      `,
      text: `Password reset requested. Visit this link to reset your password: ${resetLink}`,
      categories: ['password-reset'],
    })
  }

  async sendVerificationEmail(to: string, verificationLink: string) {
    return this.sendEmail({
      to,
      subject: 'Verify your email address',
      html: `
        <h1>Email Verification</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationLink}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
      `,
      text: `Please verify your email address by visiting: ${verificationLink}`,
      categories: ['verification'],
    })
  }

  async sendNotificationEmail(to: string, title: string, message: string) {
    return this.sendEmail({
      to,
      subject: title,
      html: `
        <h1>${title}</h1>
        <p>${message}</p>
        <p>Best regards,<br>The Team</p>
      `,
      text: `${title}\n\n${message}`,
      categories: ['notification'],
    })
  }

  // Template management
  async createTemplate(name: string, subject: string, htmlContent: string, textContent?: string) {
    try {
      const request = {
        method: 'POST' as const,
        url: '/v3/templates',
        body: {
          name,
          generation: 'dynamic',
        },
      }

      const [response] = await sgClient.request(request)
      const templateId = response.body.id

      // Add version to template
      const versionRequest = {
        method: 'POST' as const,
        url: `/v3/templates/${templateId}/versions`,
        body: {
          template_id: templateId,
          active: 1,
          name: `${name} v1`,
          subject,
          html_content: htmlContent,
          plain_content: textContent || '',
        },
      }

      await sgClient.request(versionRequest)

      return { success: true, data: { templateId, name } }
    } catch (error) {
      console.error('Failed to create template:', error)
      return { success: false, error: error as Error }
    }
  }

  // Analytics methods
  async getStats(startDate: string, endDate?: string) {
    try {
      const request = {
        method: 'GET' as const,
        url: '/v3/stats',
        qs: {
          start_date: startDate,
          end_date: endDate || startDate,
          aggregated_by: 'day',
        },
      }

      const [response] = await sgClient.request(request)
      return { success: true, data: response.body }
    } catch (error) {
      console.error('Failed to get stats:', error)
      return { success: false, error: error as Error }
    }
  }

  async getBounces(startTime?: number, endTime?: number) {
    try {
      const request = {
        method: 'GET' as const,
        url: '/v3/suppression/bounces',
        qs: {
          start_time: startTime,
          end_time: endTime,
        },
      }

      const [response] = await sgClient.request(request)
      return { success: true, data: response.body }
    } catch (error) {
      console.error('Failed to get bounces:', error)
      return { success: false, error: error as Error }
    }
  }

  async getBlocks(startTime?: number, endTime?: number) {
    try {
      const request = {
        method: 'GET' as const,
        url: '/v3/suppression/blocks',
        qs: {
          start_time: startTime,
          end_time: endTime,
        },
      }

      const [response] = await sgClient.request(request)
      return { success: true, data: response.body }
    } catch (error) {
      console.error('Failed to get blocks:', error)
      return { success: false, error: error as Error }
    }
  }

  // Contact management
  async addContact(email: string, firstName?: string, lastName?: string, customFields?: Record<string, any>) {
    try {
      const request = {
        method: 'PUT' as const,
        url: '/v3/marketing/contacts',
        body: {
          contacts: [
            {
              email,
              first_name: firstName,
              last_name: lastName,
              custom_fields: customFields,
            },
          ],
        },
      }

      const [response] = await sgClient.request(request)
      return { success: true, data: response.body }
    } catch (error) {
      console.error('Failed to add contact:', error)
      return { success: false, error: error as Error }
    }
  }
}

// Export default instance
export const emailService = new SendGridEmailService()