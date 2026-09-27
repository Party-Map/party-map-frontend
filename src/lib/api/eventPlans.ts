import { api } from '@/lib/api/client'
import type {
  EventPlan,
  EventPlanLineupInvitation,
  EventPlanListItem,
  EventPlanPayload,
  ID,
  LineupInvitationPayload,
  PlaceListItem,
} from '@/lib/types'

export const createEventPlan = (payload: EventPlanPayload) => api.post<EventPlan>('/event-plan', payload)
export const updateEventPlan = (id: ID, payload: EventPlanPayload) => api.put<EventPlan>(`/event-plan/${id}`, payload)
export const fetchOwnedEventPlans = () => api.get<EventPlanListItem[]>('/event-plan/owned-event-plans')
export const fetchEventPlan = (id: ID) => api.get<EventPlan>(`/event-plan/${id}`)
export const fetchInvitablePlaces = () => api.get<PlaceListItem[]>('/event-plan/places')
export const invitePlace = (id: ID, placeId: ID) => api.put<void>(`/event-plan/${id}/invite-place/${placeId}`)
export const fetchLineupInvitations = (id: ID) =>
  api.get<EventPlanLineupInvitation[]>(`/event-plan/${id}/lineup-invitations`)
export const addLineupInvitation = (id: ID, payload: LineupInvitationPayload) =>
  api.post<void>(`/event-plan/${id}/add-lineup-invitation`, payload)
export const deleteLineupInvitation = (id: ID, performerId: ID) =>
  api.delete<void>(`/event-plan/${id}/lineup-invitation/${performerId}`)
export const publishEventPlan = (id: ID) => api.post<void>(`/event-plan/${id}/publish`)
