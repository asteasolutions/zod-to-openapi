import { z } from 'zod/v4';
import { expectSchema } from '../lib/helpers';

describe('object polymorphism', () => {
  it('can use allOf for extended schemas', () => {
    const BaseSchema = z.object({ id: z.string() }).openapi('Base');
    const ExtendedSchema = BaseSchema.extend({ bonus: z.number() }).openapi(
      'Extended'
    );

    expectSchema([ExtendedSchema], {
      Base: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      Extended: {
        allOf: [
          { $ref: '#/components/schemas/Base' },
          {
            type: 'object',
            required: ['bonus'],
            properties: {
              bonus: { type: 'number' },
            },
          },
        ],
      },
    });
  });

  it('can chain-extend objects correctly', () => {
    const BaseSchema = z.object({ id: z.string() }).openapi('Base');

    const A = BaseSchema.extend({
      bonus: z.number(),
    }).openapi('A');

    const B = A.extend({
      points: z.number(),
    }).openapi('B');

    expectSchema([BaseSchema, A, B], {
      Base: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      A: {
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
      B: {
        allOf: [
          { $ref: '#/components/schemas/A' },
          {
            type: 'object',
            required: ['points'],
            properties: {
              points: {
                type: 'number',
              },
            },
          },
        ],
      },
    });
  });

  it('can chain-extend objects correctly without intermediate link', () => {
    const BaseSchema = z.object({ id: z.string() }).openapi('Base');
    const A = BaseSchema.extend({ bonus: z.number() });

    const B = A.extend({
      points: z.number(),
    }).openapi('B');

    expectSchema([BaseSchema, B], {
      Base: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      B: {
        allOf: [
          { $ref: '#/components/schemas/Base' },
          {
            type: 'object',
            required: ['bonus', 'points'],
            properties: {
              bonus: { type: 'number' },
              points: { type: 'number' },
            },
          },
        ],
      },
    });
  });

  it('can apply nullable', () => {
    const BaseSchema = z.object({ id: z.string().optional() }).openapi('Base');
    const ExtendedSchema = BaseSchema.extend({
      bonus: z.number().optional(),
    })
      .nullable()
      .openapi('Extended');

    expectSchema([BaseSchema, ExtendedSchema], {
      Base: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
      Extended: {
        allOf: [
          { $ref: '#/components/schemas/Base' },
          {
            type: 'object',
            properties: {
              bonus: { type: 'number' },
            },
            nullable: true,
          },
        ],
      },
    });
  });

  it('can override properties', () => {
    const AnimalSchema = z
      .object({
        name: z.string().optional(),
        type: z.enum(['dog', 'cat']).optional(),
      })
      .openapi('Animal', {
        discriminator: {
          propertyName: 'type',
        },
      });

    const DogSchema = AnimalSchema.extend({
      type: z.string().openapi({ example: 'dog' }),
    })
      .openapi('Dog', {
        discriminator: {
          propertyName: 'type',
        },
      })
      .optional();

    expectSchema([AnimalSchema, DogSchema], {
      Animal: {
        discriminator: {
          propertyName: 'type',
        },
        type: 'object',
        properties: {
          name: { type: 'string' },
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
              type: { type: 'string', example: 'dog' },
            },
            required: ['type'],
          },
        ],
      },
    });
  });

  it('treats objects created by .omit as a new object', () => {
    const BaseSchema = z
      .object({
        name: z.string(),
        type: z.enum(['dog', 'cat']).optional(),
      })
      .openapi('Base');
    const OmittedSchema = BaseSchema.omit({ type: true });

    const OtherSchema = z.object({ omit: OmittedSchema }).openapi('Other');
    expectSchema([BaseSchema, OtherSchema], {
      Base: {
        properties: {
          name: { type: 'string' },
          type: {
            enum: ['dog', 'cat'],
            type: 'string',
          },
        },
        required: ['name'],
        type: 'object',
      },
      Other: {
        properties: {
          omit: {
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
            type: 'object',
          },
        },
        required: ['omit'],
        type: 'object',
      },
    });
  });

  it('treats objects created by .pick as a new object', () => {
    const BaseSchema = z
      .object({
        name: z.string(),
        type: z.enum(['dog', 'cat']).optional(),
      })
      .openapi('Base');
    const PickedSchema = BaseSchema.pick({ name: true });

    const OtherSchema = z.object({ pick: PickedSchema }).openapi('Other');

    expectSchema([BaseSchema, OtherSchema], {
      Base: {
        properties: {
          name: { type: 'string' },
          type: {
            enum: ['dog', 'cat'],
            type: 'string',
          },
        },
        required: ['name'],
        type: 'object',
      },
      Other: {
        properties: {
          pick: {
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
            type: 'object',
          },
        },
        required: ['pick'],
        type: 'object',
      },
    });
  });
});
