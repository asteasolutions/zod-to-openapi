import { z } from 'zod'
import { expectSchema } from '../lib/helpers'

describe('optional', () => {
  it('generates OpenAPI schema for optional after the metadata', () => {
    expectSchema([z.string().optional().openapi('SimpleString')], {
      SimpleString: { type: 'string' },
    })
  })

  it('generates OpenAPI schema for optional before the metadata', () => {
    expectSchema([z.string().optional().openapi('SimpleString')], {
      SimpleString: { type: 'string' },
    })
  })

  it('supports optional nullable', () => {
    expectSchema(
      [
        z
          .object({
            test: z.string().nullable().optional(),
          })
          .openapi('SimpleObject'),
      ],
      {
        SimpleObject: {
          type: 'object',
          properties: {
            test: {
              nullable: true,
              type: 'string',
            },
          },
        },
      }
    )
  })
})
