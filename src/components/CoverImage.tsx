import { useState, type ImgHTMLAttributes } from 'react'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { cx } from '@/lib/cx'
import styles from './CoverImage.module.css'

type CoverImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | null | undefined
  alt: string
  height?: 'sm' | 'md' | 'lg'
}

/** Image with a placeholder fallback for missing or broken sources. */
export function CoverImage({ src, alt, height = 'lg', className, ...rest }: CoverImageProps) {
  const [failed, setFailed] = useState(false)
  const source = !src || failed ? PLACEHOLDER_IMAGE : src

  return (
    <img
      src={source}
      alt={alt}
      loading="lazy"
      className={cx(styles.image, styles[height], className)}
      onError={() => setFailed(true)}
      {...rest}
    />
  )
}
