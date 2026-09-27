import { Link } from 'react-router'
import { Card, CardBody } from '@/components/Card'
import { CoverImage } from '@/components/CoverImage'
import { formatDateTimeRange } from '@/lib/dates'
import type { Event, Place } from '@/lib/types'
import styles from './EventCard.module.css'

type EventCardProps = {
  event: Event
  /** When given, an "at <place>" line links to the venue. */
  place?: Place
}

/** Event summary card: cover image, time range, venue link, details link and price. */
export function EventCard({ event, place }: EventCardProps) {
  return (
    <Card>
      <CoverImage src={event.image} alt={event.title} height="md" />
      <CardBody>
        <h3 className={styles.title}>{event.title}</h3>
        <p className={styles.metaLine}>{formatDateTimeRange(event.start, event.end)}</p>
        {place && (
          <p className={styles.metaLine}>
            at{' '}
            <Link to={`/places/${place.id}`} className="link">
              {place.name}
            </Link>
          </p>
        )}
        <div className={styles.footer}>
          <Link to={`/events/${event.id}`} className={styles.details}>
            Details →
          </Link>
          {event.price && <span className={styles.price}>{event.price}</span>}
        </div>
      </CardBody>
    </Card>
  )
}
