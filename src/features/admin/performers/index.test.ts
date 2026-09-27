import * as performers from './index'

describe('admin performers index', () => {
  it('exposes the three routed pages', () => {
    expect(Object.keys(performers).sort()).toEqual(['AdminPerformersPage', 'EditPerformerPage', 'NewPerformerPage'])
    expect(performers.AdminPerformersPage).toBeTypeOf('function')
    expect(performers.EditPerformerPage).toBeTypeOf('function')
    expect(performers.NewPerformerPage).toBeTypeOf('function')
  })
})
