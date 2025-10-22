import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/feed.jpg`,
  button: {
    title: 'Play Base Jump',
    action: {
      type: 'launch_frame',
      name: 'Base Jump',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.jpg`,
      splashBackgroundColor: '#000',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Base Jump',
    openGraph: {
      title: 'Base Jump',
      description: 'Fire memecoins at lightning speed on Farcaster!',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const revalidate = 0
