// Mock email services
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  })),
}))

jest.mock('postmark', () => ({
  ServerClient: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockResolvedValue({ MessageID: 'test-message-id' }),
    sendEmailWithTemplate: jest.fn().mockResolvedValue({ MessageID: 'test-template-id' }),
    sendEmailBatch: jest.fn().mockResolvedValue([{ MessageID: 'test-batch-id' }]),
    getDeliveryStats: jest.fn().mockResolvedValue({ InactiveMails: 0, Bounces: [] }),
    getBounces: jest.fn().mockResolvedValue({ Bounces: [] }),
    getOutboundMessages: jest.fn().mockResolvedValue({ Messages: [] }),
  })),
}))

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}))

jest.mock('@sendgrid/client', () => ({
  setApiKey: jest.fn(),
  request: jest.fn().mockResolvedValue([{ body: { id: 'test-template-id' } }]),
}))

describe('Email Service Integrations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set up environment variables
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.POSTMARK_SERVER_TOKEN = 'test-postmark-token'
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key'
  })

  describe('Resend Integration', () => {
    let EmailService: any
    let emailService: any

    beforeEach(async () => {
      // Dynamically import to ensure mocks are applied
      const module = await import('../templates/email/resend/files/lib/email/resend-client')
      EmailService = module.EmailService
      emailService = module.emailService
    })

    it('should send basic email', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(true)
      expect(require('resend').Resend).toHaveBeenCalledWith('test-resend-key')
    })

    it('should send welcome email', async () => {
      const result = await emailService.sendWelcomeEmail('test@example.com', 'John Doe')

      expect(result.success).toBe(true)
      const mockResend = require('resend').Resend.mock.results[0].value
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Welcome to our platform!',
        })
      )
    })

    it('should send password reset email', async () => {
      const resetLink = 'https://example.com/reset?token=123'
      const result = await emailService.sendPasswordResetEmail('test@example.com', resetLink)

      expect(result.success).toBe(true)
      const mockResend = require('resend').Resend.mock.results[0].value
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Reset your password',
        })
      )
    })

    it('should send verification email', async () => {
      const verificationLink = 'https://example.com/verify?token=123'
      const result = await emailService.sendVerificationEmail('test@example.com', verificationLink)

      expect(result.success).toBe(true)
      const mockResend = require('resend').Resend.mock.results[0].value
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Verify your email address',
        })
      )
    })

    it('should send notification email', async () => {
      const result = await emailService.sendNotificationEmail(
        'test@example.com',
        'Important Update',
        'Your account has been updated.'
      )

      expect(result.success).toBe(true)
      const mockResend = require('resend').Resend.mock.results[0].value
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Important Update',
        })
      )
    })

    it('should send invoice email', async () => {
      const invoiceData = {
        invoiceNumber: 'INV-001',
        amount: '$99.00',
        dueDate: '2024-01-31',
        downloadLink: 'https://example.com/invoice/001',
      }

      const result = await emailService.sendInvoiceEmail('test@example.com', invoiceData)

      expect(result.success).toBe(true)
      const mockResend = require('resend').Resend.mock.results[0].value
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Invoice INV-001',
        })
      )
    })

    it('should handle email sending errors', async () => {
      const mockResend = require('resend').Resend.mock.results[0].value
      mockResend.emails.send.mockRejectedValueOnce(new Error('API Error'))

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
    })
  })

  describe('Postmark Integration', () => {
    let PostmarkEmailService: any
    let emailService: any

    beforeEach(async () => {
      const module = await import('../templates/email/postmark/files/lib/email/postmark-client')
      PostmarkEmailService = module.PostmarkEmailService
      emailService = module.emailService
    })

    it('should send basic email', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        htmlBody: '<p>Test content</p>',
      })

      expect(result.success).toBe(true)
      expect(require('postmark').ServerClient).toHaveBeenCalledWith('test-postmark-token')
    })

    it('should send email with template', async () => {
      const result = await emailService.sendEmailWithTemplate({
        to: 'test@example.com',
        templateId: 123,
        templateModel: { name: 'John Doe' },
      })

      expect(result.success).toBe(true)
      const mockClient = require('postmark').ServerClient.mock.results[0].value
      expect(mockClient.sendEmailWithTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          To: 'test@example.com',
          TemplateId: 123,
          TemplateModel: { name: 'John Doe' },
        })
      )
    })

    it('should send bulk emails', async () => {
      const emails = [
        { to: 'test1@example.com', subject: 'Test 1', htmlBody: '<p>Content 1</p>' },
        { to: 'test2@example.com', subject: 'Test 2', htmlBody: '<p>Content 2</p>' },
      ]

      const result = await emailService.sendBulkEmails(emails)

      expect(result.success).toBe(true)
      const mockClient = require('postmark').ServerClient.mock.results[0].value
      expect(mockClient.sendEmailBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ To: 'test1@example.com' }),
          expect.objectContaining({ To: 'test2@example.com' }),
        ])
      )
    })

    it('should get delivery stats', async () => {
      const result = await emailService.getDeliveryStats()

      expect(result.success).toBe(true)
      const mockClient = require('postmark').ServerClient.mock.results[0].value
      expect(mockClient.getDeliveryStats).toHaveBeenCalled()
    })

    it('should get bounces', async () => {
      const result = await emailService.getBounces({ count: 10, offset: 0 })

      expect(result.success).toBe(true)
      const mockClient = require('postmark').ServerClient.mock.results[0].value
      expect(mockClient.getBounces).toHaveBeenCalledWith(10, 0)
    })

    it('should handle API errors', async () => {
      const mockClient = require('postmark').ServerClient.mock.results[0].value
      mockClient.sendEmail.mockRejectedValueOnce(new Error('Postmark API Error'))

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        htmlBody: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
    })
  })

  describe('SendGrid Integration', () => {
    let SendGridEmailService: any
    let emailService: any

    beforeEach(async () => {
      const module = await import('../templates/email/sendgrid/files/lib/email/sendgrid-client')
      SendGridEmailService = module.SendGridEmailService
      emailService = module.emailService
    })

    it('should send basic email', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(true)
      expect(require('@sendgrid/mail').setApiKey).toHaveBeenCalledWith('test-sendgrid-key')
      expect(require('@sendgrid/mail').send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Email',
          html: '<p>Test content</p>',
        })
      )
    })

    it('should send bulk emails', async () => {
      const emails = [
        { to: 'test1@example.com', subject: 'Test 1', html: '<p>Content 1</p>' },
        { to: 'test2@example.com', subject: 'Test 2', html: '<p>Content 2</p>' },
      ]

      const result = await emailService.sendBulkEmails(emails)

      expect(result.success).toBe(true)
      expect(require('@sendgrid/mail').send).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ to: 'test1@example.com' }),
          expect.objectContaining({ to: 'test2@example.com' }),
        ])
      )
    })

    it('should create email template', async () => {
      const result = await emailService.createTemplate(
        'Welcome Template',
        'Welcome {{name}}!',
        '<h1>Welcome {{name}}!</h1>',
        'Welcome {{name}}!'
      )

      expect(result.success).toBe(true)
      expect(require('@sendgrid/client').request).toHaveBeenCalledTimes(2) // Template creation + version
    })

    it('should get email stats', async () => {
      const result = await emailService.getStats('2024-01-01', '2024-01-31')

      expect(result.success).toBe(true)
      expect(require('@sendgrid/client').request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/v3/stats',
        })
      )
    })

    it('should get bounces', async () => {
      const result = await emailService.getBounces(1640995200, 1643673600)

      expect(result.success).toBe(true)
      expect(require('@sendgrid/client').request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/v3/suppression/bounces',
        })
      )
    })

    it('should add contact', async () => {
      const result = await emailService.addContact(
        'test@example.com',
        'John',
        'Doe',
        { company: 'Test Corp' }
      )

      expect(result.success).toBe(true)
      expect(require('@sendgrid/client').request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          url: '/v3/marketing/contacts',
          body: {
            contacts: [
              {
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
                custom_fields: { company: 'Test Corp' },
              },
            ],
          },
        })
      )
    })

    it('should handle SendGrid API errors', async () => {
      require('@sendgrid/mail').send.mockRejectedValueOnce(new Error('SendGrid API Error'))

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(Error)
    })
  })

  describe('Email Template Validation', () => {
    it('should validate Resend template structure', () => {
      const template = require('../templates/email/resend/template.json')
      
      expect(template.id).toBe('resend')
      expect(template.category).toBe('email')
      expect(template.envVars).toContainEqual(
        expect.objectContaining({
          name: 'RESEND_API_KEY',
          required: true,
        })
      )
      expect(template.conflicts).toContain('postmark')
      expect(template.conflicts).toContain('sendgrid')
    })

    it('should validate Postmark template structure', () => {
      const template = require('../templates/email/postmark/template.json')
      
      expect(template.id).toBe('postmark')
      expect(template.category).toBe('email')
      expect(template.envVars).toContainEqual(
        expect.objectContaining({
          name: 'POSTMARK_SERVER_TOKEN',
          required: true,
        })
      )
      expect(template.conflicts).toContain('resend')
      expect(template.conflicts).toContain('sendgrid')
    })

    it('should validate SendGrid template structure', () => {
      const template = require('../templates/email/sendgrid/template.json')
      
      expect(template.id).toBe('sendgrid')
      expect(template.category).toBe('email')
      expect(template.envVars).toContainEqual(
        expect.objectContaining({
          name: 'SENDGRID_API_KEY',
          required: true,
        })
      )
      expect(template.conflicts).toContain('resend')
      expect(template.conflicts).toContain('postmark')
    })
  })

  describe('Environment Configuration', () => {
    it('should throw error when Resend API key is missing', () => {
      delete process.env.RESEND_API_KEY
      
      expect(() => {
        require('../templates/email/resend/files/lib/email/resend-client')
      }).toThrow('RESEND_API_KEY environment variable is required')
    })

    it('should throw error when Postmark token is missing', () => {
      delete process.env.POSTMARK_SERVER_TOKEN
      
      expect(() => {
        require('../templates/email/postmark/files/lib/email/postmark-client')
      }).toThrow('POSTMARK_SERVER_TOKEN environment variable is required')
    })

    it('should throw error when SendGrid API key is missing', () => {
      delete process.env.SENDGRID_API_KEY
      
      expect(() => {
        require('../templates/email/sendgrid/files/lib/email/sendgrid-client')
      }).toThrow('SENDGRID_API_KEY environment variable is required')
    })
  })
})