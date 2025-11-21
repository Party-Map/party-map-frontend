import {NextResponse} from 'next/server'
import {search} from '@/lib/services/searchService'

export async function GET(req: Request) {
    try {
        const {searchParams} = new URL(req.url)
        const q = searchParams.get('q') || ''
        const hits = await search(q)
        return NextResponse.json({query: q, hits})
    } catch (err) {
        return NextResponse.json({error: 'Search failed'}, {status: 500})
    }
}