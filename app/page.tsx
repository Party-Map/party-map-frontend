import MapClient from '@/components/MapClient'
import { getDataSource } from '@/lib/dataSource'

export const revalidate = 60

export default async function HomePage() {
  const ds = getDataSource()
  const places = await ds.getPlaces()
  const events = await ds.getEvents()

  return (
    <main className="fixed inset-0">
          <MapClient places={places} events={events} />
    </main>
  )
}
