import * as z from 'zod';
import { extendZodWithOpenApi } from '../src/zod-extensions';
import { expectSchema } from './lib/helpers';

// TODO: setupTests.ts
extendZodWithOpenApi(z);

describe('Polymorphism', () => {
  it('can use allOf', () => {
    const BaseSchema = z.object({ id: z.string() }).openapi({
      refId: 'Base',
    });

    const ExtendedSchema = BaseSchema.extend({
      bonus: z.number(),
    }).openapi({
      refId: 'Extended',
    });

    const TestSchema = z.object({
      key: ExtendedSchema.nullable().openapi({
        refId: 'Test',
      }),
    });

    expectSchema([BaseSchema, ExtendedSchema, TestSchema], {
      Base: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
          },
        },
      },
      Extended: {
        allOf: [
          { $ref: '#/components/schemas/Base' },
          {
            type: 'object',
            required: ['bonus'],
            properties: {
              bonus: {
                type: 'number',
              },
            },
          },
        ],
      },
    });
  });

  it.todo('can apply nullable');

  it.todo('can apply optional');

  it('can override properties', () => {
    const AnimalSchema = z
      .object({
        name: z.ostring(),
        type: z.enum(['dog', 'cat']).optional(),
      })
      .openapi({
        refId: 'Animal',
        discriminator: {
          propertyName: 'type',
        },
      });

    const DogSchema = AnimalSchema.extend({
      type: z.string().openapi({ const: 'dog' }),
    }).openapi({
      refId: 'Dog',
      discriminator: {
        propertyName: 'type',
      },
    });

    expectSchema([AnimalSchema, DogSchema], {
      Animal: {
        discriminator: {
          propertyName: 'type',
        },
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          type: { type: 'string', enum: ['dog', 'cat'] },
        },
      },
      Dog: {
        discriminator: {
          propertyName: 'type',
        },
        allOf: [
          { $ref: '#/components/schemas/Animal' },
          {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                const: 'dog',
              },
            },
            required: ['type'],
          },
        ],
      },
    });
  });
});
