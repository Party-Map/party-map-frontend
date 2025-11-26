import Link from "next/link"
import DetailPageLayout from "@/components/DetailPageLayout"

export default function SignInRequired({
                                           callback,
                                           message = "You need to be signed in to view this page.",
                                       }: {
    callback: string
    message?: string
}) {
    return (
        <DetailPageLayout>
            <div
                className="overflow-hidden rounded-2xl border border-gray-300/80 dark:border-white/10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur shadow-sm">
                <div className="p-4">
                    <h1 className="text-2xl font-bold">Sign in required</h1>

                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{message}</p>

                    <Link
                        href={`/auth/login?callback=${encodeURIComponent(callback)}`}
                        className="mt-4 inline-flex items-center rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400"
                    >
                        Go to login
                    </Link>
                </div>
            </div>
        </DetailPageLayout>
    )
}
