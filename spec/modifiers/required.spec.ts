import { expectSchema } from '../lib/helpers'
import { z } from 'zod'

describe('required', () => {
  it('can generate a schema with required', () => {
    const Schema = z
      .object({
        id: z.string(),
        name: z.string().optional(),
      })
      .required()
      .openapi('RequiredSchema')

    expectSchema([Schema], {
      RequiredSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['id', 'name'],
      },
    })
  })
})
