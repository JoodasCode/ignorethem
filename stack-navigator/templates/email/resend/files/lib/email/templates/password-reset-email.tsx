import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface PasswordResetEmailProps {
  userName: string
  resetLink: string
}

export const PasswordResetEmail = ({
  userName = 'User',
  resetLink = 'https://yourdomain.com/reset-password',
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://yourdomain.com/logo.png"
              width="120"
              height="36"
              alt="Logo"
            />
          </Section>
          
          <Heading style={h1}>Password Reset Request</Heading>
          
          <Text style={text}>
            Hi {userName},
          </Text>
          
          <Text style={text}>
            We received a request to reset your password. If you made this request,
            click the button below to create a new password:
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={resetLink}>
              Reset Password
            </Button>
          </Section>
          
          <Text style={text}>
            This link will expire in 1 hour for security reasons.
          </Text>
          
          <Text style={text}>
            If you didn't request a password reset, you can safely ignore this email.
            Your password will remain unchanged.
          </Text>
          
          <Text style={text}>
            For security reasons, this link can only be used once. If you need to
            reset your password again, please request a new reset link.
          </Text>
          
          <Text style={text}>
            If you're having trouble with the button above, copy and paste the
            following link into your browser:
          </Text>
          
          <Text style={linkText}>
            {resetLink}
          </Text>
          
          <Text style={text}>
            Best regards,<br />
            The Security Team
          </Text>
          
          <Section style={footer}>
            <Text style={footerText}>
              This email was sent because a password reset was requested for your account.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PasswordResetEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const logoContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 8px',
}

const linkText = {
  color: '#007bff',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 8px',
  wordBreak: 'break-all' as const,
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#dc3545',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
}

const footer = {
  borderTop: '1px solid #eaeaea',
  marginTop: '32px',
  paddingTop: '16px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '16px',
}