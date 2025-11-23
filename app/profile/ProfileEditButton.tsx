import Link from 'next/link'

export default function ProfileEditButton() {
    const appBase = process.env.NEXT_PUBLIC_URL_BASE!
    const issuer = process.env.AUTH_KEYCLOAK_ISSUER!
    const clientId = process.env.AUTH_KEYCLOAK_ID!
    const keycloakBase = process.env.NEXT_AUTH_KEYCLOAK_BASE!

    const issuerUrl = new URL(issuer)
    const realm = issuerUrl.pathname.split('/').filter(Boolean).pop() // "party-map"

    const callbackUrl = `${appBase}/profile`

    const accountUrl =
        `${keycloakBase}/realms/${realm}/account` +
        `?referrer=${encodeURIComponent(clientId)}` +
        `&referrer_uri=${encodeURIComponent(callbackUrl)}`

    return (
        <Link
            href={accountUrl}
            className="inline-flex items-center rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400"
        >
            Edit profile
        </Link>
    )
}
