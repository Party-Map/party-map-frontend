import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, Route, Routes } from 'react-router'
import { performer } from '@/test/fixtures'
import { renderWithProviders } from '@/test/helpers'
import { PerformerForm } from './PerformerForm'

describe('PerformerForm', () => {
  it('submits the typed values, without links or image when they are empty', async () => {
    const onSubmit = vi.fn(async () => {})
    renderWithProviders(<PerformerForm title="Create a new performer" submitLabel="Create performer" onSubmit={onSubmit} />)

    expect(screen.getByRole('heading', { name: 'Create a new performer' })).toBeInTheDocument()
    expect(screen.getByLabelText('Genre')).toHaveAttribute('placeholder', 'techno, house, live act…')

    await userEvent.type(screen.getByLabelText('Name'), ' DJ New ')
    await userEvent.type(screen.getByLabelText('Genre'), 'house ')
    await userEvent.type(screen.getByLabelText('Bio'), ' Plays house. ')
    await userEvent.click(screen.getByRole('button', { name: 'Create performer' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({ name: 'DJ New', genre: 'house', bio: 'Plays house.', image: null })
  })

  it('prefills every field and submits them unchanged', async () => {
    const onSubmit = vi.fn(async () => {})
    renderWithProviders(<PerformerForm title="Edit performer" submitLabel="Save changes" initialValues={performer} onSubmit={onSubmit} />)

    expect(screen.getByLabelText('Name')).toHaveValue(performer.name)
    expect(screen.getByLabelText('Genre')).toHaveValue(performer.genre)
    expect(screen.getByLabelText('Bio')).toHaveValue(performer.bio)
    expect(screen.getByRole('textbox', { name: 'Instagram link' })).toHaveValue('djtest')
    expect(screen.getByLabelText('Profile image URL')).toHaveValue(performer.image)

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      name: performer.name,
      genre: performer.genre,
      bio: performer.bio,
      image: performer.image,
      links: performer.links,
    })
  })

  it('treats a performer without links as having none', async () => {
    const onSubmit = vi.fn(async () => {})
    const { links: _links, ...withoutLinks } = performer
    renderWithProviders(<PerformerForm title="Edit performer" submitLabel="Save changes" initialValues={withoutLinks} onSubmit={onSubmit} />)

    expect(screen.queryByRole('combobox', { name: 'Link type' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({ name: performer.name, genre: performer.genre, bio: performer.bio, image: performer.image })
  })

  it('shows the busy state while saving and an error when saving fails', async () => {
    let reject: (reason: Error) => void = () => {}
    const onSubmit = vi.fn(() => new Promise<void>((_, rej) => (reject = rej)))
    renderWithProviders(<PerformerForm title="Edit performer" submitLabel="Save changes" initialValues={performer} onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

    act(() => reject(new Error('boom')))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save performer. Please try again.')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
  })

  it('goes back in history on cancel', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/" element={<Link to="/form">open form</Link>} />
        <Route path="/form" element={<PerformerForm title="Create a new performer" submitLabel="Create performer" onSubmit={async () => {}} />} />
      </Routes>,
      { route: '/' },
    )

    await userEvent.click(screen.getByRole('link', { name: 'open form' }))
    expect(await screen.findByRole('heading', { name: 'Create a new performer' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByRole('link', { name: 'open form' })).toBeInTheDocument()
  })
})
