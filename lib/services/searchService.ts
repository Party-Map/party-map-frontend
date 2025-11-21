import {buildSearchHits} from '../search'
import {createRepositories, getDataSource} from '../dataSource'

export async function search(query: string) {
    const ds = getDataSource()
    const {places, events, performers} = createRepositories(ds)
    const [pl, ev, pr] = await Promise.all([
        places.all(),
        events.all(),
        performers.all(),
    ])
    return buildSearchHits(query, {places: pl, events: ev, performers: pr})
}
