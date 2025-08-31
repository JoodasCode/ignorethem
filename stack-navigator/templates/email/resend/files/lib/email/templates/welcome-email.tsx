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

interface WelcomeEmailProps {
  userName: string
  loginUrl?: string
}

export const WelcomeEmail = ({
  userName = 'User',
  loginUrl = 'https://yourdomain.com/login',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform, {userName}!</Preview>
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
          
          <Heading style={h1}>Welcome to our platform!</Heading>
          
          <Text style={text}>
            Hi {userName},
          </Text>
          
          <Text style={text}>
            Thank you for joining our platform. We're excited to have you on board
            and can't wait to see what you'll build with us.
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={loginUrl}>
              Get Started
            </Button>
          </Section>
          
          <Text style={text}>
            Here are a few things you can do to get started:
          </Text>
          
          <ul style={list}>
            <li>Complete your profile setup</li>
            <li>Explore our features and tools</li>
            <li>Join our community forum</li>
            <li>Check out our documentation</li>
          </ul>
          
          <Text style={text}>
            If you have any questions or need help getting started, don't hesitate
            to reach out to our support team. We're here to help!
          </Text>
          
          <Text style={text}>
            Best regards,<br />
            The Team
          </Text>
          
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this email because you signed up for our platform.
            </Text>
            <Link href="https://yourdomain.com/unsubscribe" style={footerLink}>
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail

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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
}

const list = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 8px',
  paddingLeft: '20px',
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

const footerLink = {
  color: '#666',
  fontSize: '12px',
  textDecoration: 'underline',
}