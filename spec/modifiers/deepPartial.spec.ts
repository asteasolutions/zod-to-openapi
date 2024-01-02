import { z } from 'zod';
import { expectSchema, generateDataForRoute } from '../lib/helpers';

describe('describe', () => {
  it('generates a deepPartial object', () => {
    const schema = z.object({
      a: z.string(),
      b: z.number(),
    });

    const { requestBody } = generateDataForRoute({
      request: {
        body: {
          description: 'Test description',
          required: true,
          content: {
            'application/json': {
              schema: schema.deepPartial(),
            },
          },
        },
      },
    });

    expect(requestBody).toEqual({
      description: 'Test description',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              a: { type: 'string' },
              b: { type: 'number' },
            },
          },
        },
      },
    });
  });

  it('generates a deepPartial object from a registered schema', () => {
    const schema = z
      .object({
        a: z.string(),
        b: z.number(),
      })
      .openapi('TestSchema');

    const { documentSchemas, requestBody, responses } = generateDataForRoute({
      request: {
        body: {
          description: 'Test description',
          required: true,
          content: {
            'application/json': {
              schema: schema.deepPartial(),
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Response description',
          content: {
            'application/json': { schema },
          },
        },
      },
    });

    // The schema is registered
    expect(documentSchemas).toEqual({
      TestSchema: {
        type: 'object',
        properties: {
          a: { type: 'string' },
          b: { type: 'number' },
        },
        required: ['a', 'b'],
      },
    });

    expect(responses[200]).toEqual({
      description: 'Response description',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/TestSchema' },
        },
      },
    });

    expect(requestBody).toEqual({
      description: 'Test description',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              a: { type: 'string' },
              b: { type: 'number' },
            },
          },
        },
      },
    });
  });
});
