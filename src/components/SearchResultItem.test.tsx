import { fireEvent, render, within } from '@testing-library/react'
import { SearchResultItem } from '@/components/SearchResultItem'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import type { SearchHit } from '@/lib/types'
import { event, performer, place } from '@/test/fixtures'

const placeHit: SearchHit = {
  id: place.id,
  type: 'PLACE',
  title: place.name,
  subtitle: place.city,
  image: place.image,
  nextEventStart: event.start,
  placeId: null,
}

const eventHit: SearchHit = { ...placeHit, id: event.id, type: 'EVENT', title: event.title, subtitle: place.name, placeId: place.id }

const performerHit: SearchHit = {
  id: performer.id,
  type: 'PERFORMER',
  title: performer.name,
  subtitle: performer.genre,
  image: null,
  nextEventStart: null,
  placeId: null,
}

function renderItem(hit: SearchHit) {
  const onPick = vi.fn()
  const onView = vi.fn()
  const { container } = render(
    <ul>
      <SearchResultItem hit={hit} onPick={onPick} onView={onView} />
    </ul>,
  )
  return { onPick, onView, item: within(container).getByRole('listitem') }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2030, 5, 15, 12, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SearchResultItem', () => {
  it('shows the title, subtitle, type pill, thumbnail letter and next event date', () => {
    const { item } = renderItem(placeHit)
    expect(within(item).getByText('A38 Hajó')).toHaveClass('itemTitle')
    expect(within(item).getByText('Budapest')).toHaveClass('itemSubtitle')
    expect(within(item).getByText('Place')).toHaveClass('typePill', 'typePLACE')
    expect(within(item).getByText('P')).toHaveClass('thumbLetter')
    expect(within(item).getByText('1 Jun')).toHaveClass('itemDate')
    expect(item.querySelector('img')).toHaveAttribute('src', place.image)
  })

  it('labels events and performers by type', () => {
    expect(within(renderItem(eventHit).item).getByText('Event')).toHaveClass('typeEVENT')
    expect(within(renderItem(performerHit).item).getByText('Performer')).toHaveClass('typePERFORMER')
  })

  it('omits the date without an upcoming event and uses the placeholder image', () => {
    const { item } = renderItem(performerHit)
    expect(item.querySelector('.itemDate')).toBeNull()
    expect(item.querySelector('img')).toHaveAttribute('src', PLACEHOLDER_IMAGE)
    expect(within(item).getByText('techno')).toHaveClass('itemSubtitle')
  })

  it('picks from the main button and views from the view button independently', () => {
    const { item, onPick, onView } = renderItem(eventHit)
    fireEvent.click(within(item).getByRole('button', { name: /Techno Night/ }))
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onView).not.toHaveBeenCalled()

    fireEvent.click(within(item).getByRole('button', { name: 'View' }))
    expect(onView).toHaveBeenCalledTimes(1)
    expect(onPick).toHaveBeenCalledTimes(1)
  })
})
