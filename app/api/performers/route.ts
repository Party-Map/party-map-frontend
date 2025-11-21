import {NextResponse} from 'next/server'
import {createRepositories, getDataSource} from '@/lib/dataSource'

export async function GET() {
    try {
        const ds = getDataSource()
        const {performers} = createRepositories(ds)
        const all = await performers.all()
        return NextResponse.json(all)
    } catch {
        return NextResponse.json({error: 'Failed to fetch performers'}, {status: 500})
    }
}