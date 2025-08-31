import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  react?: React.ReactElement
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  tags?: { name: string; value: string }[]
  headers?: Record<string, string>
}

export class EmailService {
  private defaultFrom: string

  constructor(defaultFrom = 'noreply@yourdomain.com') {
    this.defaultFrom = defaultFrom
  }

  async sendEmail(options: EmailOptions) {
    try {
      const result = await resend.emails.send({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        react: options.react,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        tags: options.tags,
        headers: options.headers,
      })

      return { success: true, data: result }
    } catch (error) {
      console.error('Failed to send email:', error)
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
    })
  }

  async sendInvoiceEmail(to: string, invoiceData: {
    invoiceNumber: string
    amount: string
    dueDate: string
    downloadLink: string
  }) {
    return this.sendEmail({
      to,
      subject: `Invoice ${invoiceData.invoiceNumber}`,
      html: `
        <h1>Invoice ${invoiceData.invoiceNumber}</h1>
        <p>Thank you for your business! Here are the details of your invoice:</p>
        <ul>
          <li><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</li>
          <li><strong>Amount:</strong> ${invoiceData.amount}</li>
          <li><strong>Due Date:</strong> ${invoiceData.dueDate}</li>
        </ul>
        <p><a href="${invoiceData.downloadLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Invoice</a></p>
      `,
      text: `Invoice ${invoiceData.invoiceNumber} - Amount: ${invoiceData.amount}, Due: ${invoiceData.dueDate}. Download: ${invoiceData.downloadLink}`,
    })
  }
}

// Export default instance
export const emailService = new EmailService()