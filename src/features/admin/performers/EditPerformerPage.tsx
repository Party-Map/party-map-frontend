import { useNavigate, useParams } from 'react-router'
import { useToast } from '@/app/ToastProvider'
import { ErrorState, LoadingState } from '@/components/States'
import { RequireRole } from '@/features/admin/RequireRole'
import { fetchPerformer, fetchPerformerInvitations, updatePerformer } from '@/lib/api/performers'
import { Role } from '@/lib/auth/roles'
import { useResource } from '@/lib/hooks/useResource'
import type { PerformerPayload } from '@/lib/types'
import { PerformerForm } from './PerformerForm'
import { PerformerInvitationRequests } from './PerformerInvitationRequests'
import styles from '@/features/admin/admin.module.css'

/** /admin/performers/:id: edit a performer and answer the lineup invitations it received. */
export function EditPerformerPage() {
  return (
    <RequireRole role={Role.PERFORMER_MANAGER}>
      <PerformerEditor />
    </RequireRole>
  )
}

/** Loads only once the role guard has let the user through. */
function PerformerEditor() {
  const id = useParams<'id'>().id ?? ''
  const navigate = useNavigate()
  const toast = useToast()
  const performer = useResource(() => fetchPerformer(id), [id])
  const invitations = useResource(() => fetchPerformerInvitations(id), [id])

  if (performer.loading || invitations.loading) return <LoadingState />
  if (!performer.data || !invitations.data) {
    const reload = () => {
      performer.reload()
      invitations.reload()
    }
    return <ErrorState message="Could not load this performer." onRetry={reload} />
  }

  const handleSubmit = async (payload: PerformerPayload) => {
    const updated = await updatePerformer(id, payload)
    toast.success('Performer saved.')
    navigate(`/performers/${updated.id}`)
  }

  return (
    <div className={styles.detail}>
      <PerformerForm title="Edit performer" submitLabel="Save changes" initialValues={performer.data} onSubmit={handleSubmit} />
      <PerformerInvitationRequests performerId={id} requests={invitations.data} onChanged={invitations.reload} />
    </div>
  )
}
