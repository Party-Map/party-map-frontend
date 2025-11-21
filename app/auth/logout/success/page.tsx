import { getJwtSession } from '@/lib/auth/server-session'
import React from 'react'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

export default async function LogoutSuccessfulPage() {
    const session = await getJwtSession()
    if (session) {
        return redirect('/')
    }

    return (
        <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
            <div className="text-center">
                <div className="flex justify-center">
                    <ShieldCheck className="mt-4 h-32 w-32 text-green-500" />
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                    You are now logged out
                </h1>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <a
                        href="/"
                        className="rounded-md bg-blue-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Go back home
                    </a>
                </div>
            </div>
        </main>
    )
}
