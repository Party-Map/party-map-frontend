import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import styles from './States.module.css'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <LoaderCircle className={styles.spinner} aria-hidden />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className={styles.state} role="alert">
      <span className={styles.error}>{message}</span>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <p className={styles.empty}>{message}</p>
}
