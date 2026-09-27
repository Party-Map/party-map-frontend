import { useState } from 'react'
import { useToast } from '@/app/ToastProvider'
import { Button } from '@/components/Button'
import { Field, FormError, formStyles, Select } from '@/components/Field'
import { fetchInvitablePlaces, invitePlace } from '@/lib/api/eventPlans'
import { useResource } from '@/lib/hooks/useResource'
import type { ID } from '@/lib/types'

type InvitePlaceProps = {
  planId: ID
  /** Called after an invitation was sent so the page can reload the plan. */
  onChanged: () => void
}

/** Pick one of the places that can host this plan and send it an invitation. */
export function InvitePlace({ planId, onChanged }: InvitePlaceProps) {
  const toast = useToast()
  const places = useResource(fetchInvitablePlaces, [])
  const [placeId, setPlaceId] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    setSending(true)
    try {
      await invitePlace(planId, placeId)
      toast.success('Invitation sent.')
      onChanged()
    } catch {
      toast.error('Could not send the invitation. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="stack">
      <p className="text-muted">Select a place and send an invitation for this event plan.</p>

      <Field label="Place">
        {(id) => (
          <Select id={id} value={placeId} onChange={(e) => setPlaceId(e.target.value)} disabled={places.loading}>
            <option value="">Choose place to invite</option>
            {(places.data ?? []).map((place) => (
              <option key={place.id} value={place.id}>
                {`${place.name} — ${place.city} (${place.address})`}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {places.error && <FormError message="Could not load the places you can invite." />}

      <div className={formStyles.actions}>
        <Button onClick={send} disabled={!placeId || sending}>
          {sending ? 'Sending…' : 'Send Invitation'}
        </Button>
      </div>
    </div>
  )
}
