import { z } from 'zod'
import { expectSchema, generateDataForRoute } from '../lib/helpers'

describe('describe', () => {
  it('generates OpenAPI schema with description when the .describe method is used', () => {
    const schema = z
      .string()
      .describe('This is a test string')
      .openapi('SimpleString')

    expectSchema([schema], {
      SimpleString: { type: 'string', description: 'This is a test string' },
    })
  })

  it('can get description from a schema made optional', () => {
    const schema = z
      .string()
      .describe('This is a test string')
      .optional()
      .openapi('SimpleString')

    expectSchema([schema], {
      SimpleString: { type: 'string', description: 'This is a test string' },
    })
  })

  it('can get description from an optional schema', () => {
    const schema = z
      .string()
      .optional()
      .describe('This is a test string')
      .openapi('SimpleString')

    expectSchema([schema], {
      SimpleString: { type: 'string', description: 'This is a test string' },
    })
  })

  it('can overload descriptions from .describe with .openapi', () => {
    const schema = z
      .string()
      .describe('This is a test string')
      .openapi('SimpleString', { description: 'Alternative description' })

    expectSchema([schema], {
      SimpleString: {
        type: 'string',
        description: 'Alternative description',
      },
    })
  })

  it('can use nested descriptions from .describe with .openapi', () => {
    const schema = z
      .object({
        type: z.string().describe('Just a type'),
        title: z.string().describe('Just a title').optional(),
      })
      .describe('Whole object')
      .openapi('Test')

    expectSchema([schema], {
      Test: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Just a type',
          },
          title: {
            type: 'string',
            description: 'Just a title',
          },
        },
        required: ['type'],
        description: 'Whole object',
      },
    })
  })

  it('generates an optional query parameter with a provided description', () => {
    const { parameters } = generateDataForRoute({
      request: {
        query: z.object({
          test: z.string().optional().describe('Some parameter'),
        }),
      },
    })

    expect(parameters).toEqual([
      {
        in: 'query',
        name: 'test',
        description: 'Some parameter',
        required: false,
        schema: {
          description: 'Some parameter',
          type: 'string',
        },
      },
    ])
  })

  it('generates a query parameter with a description made optional', () => {
    const { parameters } = generateDataForRoute({
      request: {
        query: z.object({
          test: z.string().describe('Some parameter').optional(),
        }),
      },
    })

    expect(parameters).toEqual([
      {
        in: 'query',
        name: 'test',
        description: 'Some parameter',
        required: false,
        schema: {
          description: 'Some parameter',
          type: 'string',
        },
      },
    ])
  })

  it('generates a query parameter with description from a registered schema', () => {
    const schema = z.string().describe('Some parameter').openapi('SomeString')
    const { parameters, documentSchemas } = generateDataForRoute({
      request: {
        query: z.object({ test: schema }),
      },
    })

    expect(documentSchemas).toEqual({
      SomeString: {
        type: 'string',
        description: 'Some parameter',
      },
    })

    expect(parameters).toEqual([
      {
        in: 'query',
        name: 'test',
        description: 'Some parameter',
        required: true,
        schema: {
          $ref: '#/components/schemas/SomeString',
        },
      },
    ])
  })
})
