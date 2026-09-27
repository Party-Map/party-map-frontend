import { useNavigate } from 'react-router'
import { useToast } from '@/app/ToastProvider'
import { RequireRole } from '@/features/admin/RequireRole'
import { createPlace } from '@/lib/api/places'
import { Role } from '@/lib/auth/roles'
import type { PlacePayload } from '@/lib/types'
import { PlaceForm } from './PlaceForm'

/** /admin/places/new: create a place, then open its public page. */
export function NewPlacePage() {
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (payload: PlacePayload) => {
    const created = await createPlace(payload)
    toast.success('Place created.')
    navigate(`/places/${created.id}`)
  }

  return (
    <RequireRole role={Role.PLACE_MANAGER}>
      <PlaceForm title="Create a new place" submitLabel="Create place" onSubmit={handleSubmit} />
    </RequireRole>
  )
}
