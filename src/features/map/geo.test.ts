import { toLatLngTuple } from './geo'

describe('toLatLngTuple', () => {
  it('orders latitude before longitude', () => {
    expect(toLatLngTuple({ latitude: 47.5, longitude: 19.05 })).toEqual([47.5, 19.05])
  })
})
