import Link from 'next/link'
import DetailPageLayout from '@/components/DetailPageLayout'
import {getJwtSession} from '@/lib/auth/server-session'
import ProfileEditButton from './ProfileEditButton'
import {KeycloakJWTPayload} from "@/lib/auth/jwt-session";
import SignInRequired from "@/components/SignInRequired";

export default async function ProfilePage() {
    const session = await getJwtSession()

    if (!session) {
        return <SignInRequired callback="/profile" message="You need to be signed in to view your profile."/>
    }

    const rawToken = session.getJwtClaims()
    const token: KeycloakJWTPayload = rawToken ?? {}

    const fullName =
        token.name ||
        [token.given_name, token.family_name].filter(Boolean).join(' ') ||
        'Unknown user'

    const email = token.email ?? 'Not provided'

    const initials =
        fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((p) => p[0]?.toUpperCase() ?? '')
            .join('')
            .slice(0, 2) || '?'

    return (
        <DetailPageLayout>
            <div
                className="overflow-hidden rounded-2xl border border-gray-300/80 dark:border-white/10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur shadow-sm">
                <div className="flex flex-col p-4 gap-2">
                    <h1 className="text-2xl font-bold">Profile</h1>

                    <div className="mt-4 flex items-center gap-4">
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-600/10 text-xl font-semibold text-violet-700 dark:text-violet-300">
                            {initials}
                        </div>

                        <div>
                            <p className="text-lg font-semibold">{fullName}</p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300">{email}</p>
                        </div>
                        <ProfileEditButton/>
                        {session.isAdmin() && (
                            <button
                                className="inline-flex items-center rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400">
                                <Link href="/admin">
                                    Admin page
                                </Link>
                            </button>
                        )
                        }
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="gap-2">
                            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 ">
                                Given name
                            </h2>
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                                {token.given_name ?? '—'}
                            </p>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                                Family name
                            </h2>
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                                {token.family_name ?? '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DetailPageLayout>
    )
}
