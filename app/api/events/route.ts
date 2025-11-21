import {NextResponse} from 'next/server'
import {createRepositories, getDataSource} from '@/lib/dataSource'

export async function GET(req: Request) {
    try {
        const {searchParams} = new URL(req.url)
        const place = searchParams.get('place')
        const ds = getDataSource()
        const {events} = createRepositories(ds)
        const all = await events.all()
        const filtered = place ? all.filter(e => e.placeId === place) : all
        return NextResponse.json({events: filtered})
    } catch (e) {
        return NextResponse.json({error: 'Failed'}, {status: 500})
    }
}