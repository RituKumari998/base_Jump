'use client'

import { UsersPage } from '@/components/UsersPage'
import { useRouter } from 'next/navigation'

export default function UsersPageRoute() {
  const router = useRouter()

  const handleBack = () => {
    router.back() // or router.push('/') to go to home
  }

  return <UsersPage onBack={handleBack} />
}
