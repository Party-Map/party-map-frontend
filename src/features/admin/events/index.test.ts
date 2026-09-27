import { AdminEventsPage } from './AdminEventsPage'
import { EventPlanPage } from './EventPlanPage'
import * as events from './index'
import { NewEventPlanPage } from './NewEventPlanPage'

describe('admin events index', () => {
  it('exports the three pages', () => {
    expect(events.AdminEventsPage).toBe(AdminEventsPage)
    expect(events.NewEventPlanPage).toBe(NewEventPlanPage)
    expect(events.EventPlanPage).toBe(EventPlanPage)
  })
})
