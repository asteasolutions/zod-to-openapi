import { z } from 'zod'
import { expectSchema } from '../lib/helpers'

describe('readonly', () => {
  it('supports readonly', () => {
    expectSchema([z.string().readonly().openapi('ReadonlyString')], {
      ReadonlyString: {
        type: 'string',
      },
    })
  })
})
