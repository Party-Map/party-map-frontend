import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '@/lib/cx'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'bar'
export type ButtonSize = 'sm' | 'md'

type StyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  className?: string
}

export function buttonClass({ variant = 'primary', size = 'md', block = false, className }: StyleProps): string {
  return cx(styles.button, styles[variant], styles[size], block && styles.block, className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & StyleProps & { children: ReactNode }

export function Button({ variant, size, block, className, type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass({ variant, size, block, className })} {...rest}>
      {children}
    </button>
  )
}

type ButtonLinkProps = LinkProps & StyleProps & { children: ReactNode }

export function ButtonLink({ variant, size, block, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, block, className })} {...rest}>
      {children}
    </Link>
  )
}
