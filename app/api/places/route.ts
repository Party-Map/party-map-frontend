import {NextResponse} from 'next/server'
import {createRepositories, getDataSource} from '@/lib/dataSource'

export async function GET() {
    try {
        const ds = getDataSource()
        const {places} = createRepositories(ds)
        const all = await places.all()
        return NextResponse.json(all)
    } catch {
        return NextResponse.json({error: 'Failed to fetch places'}, {status: 500})
    }
}