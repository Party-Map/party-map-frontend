import { useNavigate } from 'react-router'
import { useToast } from '@/app/ToastProvider'
import { RequireRole } from '@/features/admin/RequireRole'
import { createPerformer } from '@/lib/api/performers'
import { Role } from '@/lib/auth/roles'
import type { PerformerPayload } from '@/lib/types'
import { PerformerForm } from './PerformerForm'

/** /admin/performers/new: create a performer, then open its public page. */
export function NewPerformerPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (payload: PerformerPayload) => {
    const created = await createPerformer(payload)
    toast.success('Performer created.')
    navigate(`/performers/${created.id}`)
  }

  return (
    <RequireRole role={Role.PERFORMER_MANAGER}>
      <PerformerForm title="Create a new performer" submitLabel="Create performer" onSubmit={handleSubmit} />
    </RequireRole>
  )
}
