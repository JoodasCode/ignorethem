import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/resend-client'
import { WelcomeEmail } from '@/lib/email/templates/welcome-email'
import { PasswordResetEmail } from '@/lib/email/templates/password-reset-email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, to, data } = body

    if (!type || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: type, to' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'welcome':
        result = await emailService.sendEmail({
          to,
          subject: 'Welcome to our platform!',
          react: WelcomeEmail({
            userName: data?.userName || 'User',
            loginUrl: data?.loginUrl,
          }),
        })
        break

      case 'password-reset':
        if (!data?.resetLink) {
          return NextResponse.json(
            { error: 'Missing resetLink for password reset email' },
            { status: 400 }
          )
        }
        result = await emailService.sendEmail({
          to,
          subject: 'Reset your password',
          react: PasswordResetEmail({
            userName: data?.userName || 'User',
            resetLink: data.resetLink,
          }),
        })
        break

      case 'verification':
        if (!data?.verificationLink) {
          return NextResponse.json(
            { error: 'Missing verificationLink for verification email' },
            { status: 400 }
          )
        }
        result = await emailService.sendVerificationEmail(to, data.verificationLink)
        break

      case 'notification':
        if (!data?.title || !data?.message) {
          return NextResponse.json(
            { error: 'Missing title or message for notification email' },
            { status: 400 }
          )
        }
        result = await emailService.sendNotificationEmail(to, data.title, data.message)
        break

      case 'invoice':
        if (!data?.invoiceNumber || !data?.amount || !data?.dueDate || !data?.downloadLink) {
          return NextResponse.json(
            { error: 'Missing invoice data' },
            { status: 400 }
          )
        }
        result = await emailService.sendInvoiceEmail(to, data)
        break

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error?.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}