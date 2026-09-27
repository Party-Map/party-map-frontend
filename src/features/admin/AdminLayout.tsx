import { ChevronLeft } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { SignInRequired } from '@/components/auth/SignInRequired'
import { BottomBar } from '@/components/BottomBar'
import { ButtonLink } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageShell } from '@/components/PageShell'
import { LoadingState } from '@/components/States'
import { AdminTopBar } from '@/components/TopBar'
import { useAuth } from '@/lib/auth/AuthProvider'
import { cx } from '@/lib/cx'
import { sectionsForRoles } from './sections'
import styles from './AdminLayout.module.css'

/** Frame for every /admin route: admin header, role tabs, and the section content. */
export function AdminLayout() {
  const { status, roles, isAdmin } = useAuth()

  if (status === 'loading') {
    return (
      <PageShell>
        <LoadingState label="Checking your access…" />
      </PageShell>
    )
  }

  if (status === 'anonymous') {
    return <SignInRequired returnTo="/admin" message="You need to be signed in to view your Admin page." />
  }

  if (!isAdmin) {
    return (
      <PageShell>
        <Card padded>
          <h1 className="page-title">You have no access to the admin page.</h1>
          <p className="text-muted" style={{ marginTop: 'var(--space-2)' }}>
            Please contact an admin to acquire access to the admin page.
          </p>
          <ButtonLink to="/profile" style={{ marginTop: 'var(--space-4)' }}>
            Go to Profile
          </ButtonLink>
        </Card>
      </PageShell>
    )
  }

  const sections = sectionsForRoles(roles)

  return (
    <>
      <AdminTopBar />
      <BottomBar />
      <main className={styles.main}>
        <Link to="/" className={styles.back}>
          <ChevronLeft size={16} aria-hidden />
          Back to Map
        </Link>

        {sections.length > 1 && (
          <nav className={styles.tabs} aria-label="Admin sections">
            {sections.map((section) => (
              <NavLink
                key={section.path}
                to={section.path}
                className={({ isActive }) => cx(styles.tab, isActive && styles.tabActive)}
              >
                {section.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </>
  )
}
