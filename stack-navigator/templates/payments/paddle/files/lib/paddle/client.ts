import { initializePaddle, Paddle } from '@paddle/paddle-js'

let paddleInstance: Paddle | undefined

export const getPaddle = async (): Promise<Paddle> => {
  if (!paddleInstance) {
    paddleInstance = await initializePaddle({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      environment: (process.env.PADDLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    })
  }
  return paddleInstance
}