import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('record', () => {
  it('supports records', () => {
    const base = z.object({ a: z.string() });

    const record = z.record(base).openapi('Record');

    expectSchema([base, record], {
      Record: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            a: { type: 'string' },
          },
          required: ['a'],
        },
      },
    });
  });

  it('supports records with refs', () => {
    const base = z.object({ a: z.string() }).openapi('Base');

    const record = z.record(base).openapi('Record');

    expectSchema([base, record], {
      Base: {
        type: 'object',
        properties: {
          a: { type: 'string' },
        },
        required: ['a'],
      },
      Record: {
        type: 'object',
        additionalProperties: {
          $ref: '#/components/schemas/Base',
        },
      },
    });
  });

  it('can automatically register record items', () => {
    const schema = z.record(z.number().openapi('NumberId')).openapi('Record');

    expectSchema([schema], {
      NumberId: {
        type: 'number',
      },

      Record: {
        type: 'object',
        additionalProperties: {
          $ref: '#/components/schemas/NumberId',
        },
      },
    });
  });

  describe('Enum keys', () => {
    it('supports records with enum keys', () => {
      const continents = z.enum(['EUROPE', 'AFRICA']);

      const countries = z.enum(['USA', 'CAN']);

      const countryContent = z
        .object({ countries: countries.array() })
        .openapi('Content');

      const Geography = z
        .record(continents, countryContent)
        .openapi('Geography');

      expectSchema([Geography], {
        Content: {
          type: 'object',
          properties: {
            countries: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['USA', 'CAN'],
              },
            },
          },
          required: ['countries'],
        },

        Geography: {
          type: 'object',
          properties: {
            EUROPE: { $ref: '#/components/schemas/Content' },
            AFRICA: { $ref: '#/components/schemas/Content' },
          },
        },
      });
    });

    it('supports records with native enum keys', () => {
      enum Continents {
        EUROPE,
        AFRICA,
      }

      const continents = z.nativeEnum(Continents);

      const countries = z.enum(['USA', 'CAN']);

      const countryContent = z
        .object({ countries: countries.array() })
        .openapi('Content');

      const Geography = z
        .record(continents, countryContent)
        .openapi('Geography');

      expectSchema([Geography], {
        Content: {
          type: 'object',
          properties: {
            countries: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['USA', 'CAN'],
              },
            },
          },
          required: ['countries'],
        },

        Geography: {
          type: 'object',
          properties: {
            EUROPE: { $ref: '#/components/schemas/Content' },
            AFRICA: { $ref: '#/components/schemas/Content' },
          },
        },
      });
    });
  });
});
