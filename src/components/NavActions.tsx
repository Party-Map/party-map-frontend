import { Heart, LogIn, LogOut, User } from 'lucide-react'
import { NavLink } from 'react-router'
import { useAuth } from '@/lib/auth/AuthProvider'
import { cx } from '@/lib/cx'
import styles from './NavActions.module.css'

const ICON_SIZE = { desktop: 16, mobile: 20 }

/** Profile / Likes / Sign in / Logout actions shared by the top bar (desktop) and bottom bar (mobile). */
export function NavActions({ variant }: { variant: 'desktop' | 'mobile' }) {
  const { status, login, logout } = useAuth()
  const size = ICON_SIZE[variant]
  const itemClass = cx(styles.item, styles[variant])

  if (status !== 'authenticated') {
    return (
      <nav className={cx(styles.nav, styles[`${variant}Nav`], styles.anonymous)} aria-label="Account">
        <button type="button" className={itemClass} onClick={() => login()}>
          <LogIn size={size} aria-hidden />
          <span>Sign in</span>
        </button>
      </nav>
    )
  }

  return (
    <nav className={cx(styles.nav, styles[`${variant}Nav`])} aria-label="Account">
      <NavLink to="/profile" end className={({ isActive }) => cx(itemClass, isActive && styles.active)}>
        <User size={size} aria-hidden />
        <span>Profile</span>
      </NavLink>
      <NavLink to="/profile/likes" className={({ isActive }) => cx(itemClass, isActive && styles.active)}>
        <Heart size={size} aria-hidden />
        <span>Likes</span>
      </NavLink>
      <button type="button" className={itemClass} onClick={logout}>
        <LogOut size={size} aria-hidden />
        <span>Logout</span>
      </button>
    </nav>
  )
}
