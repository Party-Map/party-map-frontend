import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { SignInRequired } from '@/components/auth/SignInRequired'
import { PageShell } from '@/components/PageShell'
import { LoadingState } from '@/components/States'
import { useAuth } from '@/lib/auth/AuthProvider'

/** Renders children only for signed-in users; shows the sign-in prompt otherwise. */
export function RequireAuth({ children, message }: { children: ReactNode; message?: string }) {
  const { status } = useAuth()
  const { pathname, search } = useLocation()

  if (status === 'loading') {
    return (
      <PageShell>
        <LoadingState label="Checking your session…" />
      </PageShell>
    )
  }
  if (status === 'anonymous') {
    return <SignInRequired returnTo={`${pathname}${search}`} {...(message ? { message } : {})} />
  }
  return <>{children}</>
}
