import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('object polymorphism', () => {
  it.concurrent('can use allOf for extended schemas', () => {
    const BaseSchema = registerSchema('Base', z.object({ id: z.string() }));

    const ExtendedSchema = registerSchema(
      'Extended',
      BaseSchema.extend({ bonus: z.number() })
    );

    expectSchema([BaseSchema, ExtendedSchema], {
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

  it.concurrent('can chain-extend objects correctly', () => {
    const BaseSchema = registerSchema('Base', z.object({ id: z.string() }));

    const A = registerSchema(
      'A',
      BaseSchema.extend({
        bonus: z.number(),
      })
    );

    const B = registerSchema(
      'B',
      A.extend({
        points: z.number(),
      })
    );

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

  it.concurrent(
    'can chain-extend objects correctly without intermediate link',
    () => {
      const BaseSchema = registerSchema('Base', z.object({ id: z.string() }));

      const A = BaseSchema.extend({ bonus: z.number() });

      const B = registerSchema(
        'B',
        A.extend({
          points: z.number(),
        })
      );

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
    }
  );

  it.concurrent('can apply nullable', () => {
    const BaseSchema = registerSchema('Base', z.object({ id: z.ostring() }));

    const ExtendedSchema = registerSchema(
      'Extended',
      BaseSchema.extend({
        bonus: z.onumber(),
      }).nullable()
    );

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

  it.concurrent('can override properties', () => {
    const AnimalSchema = registerSchema(
      'Animal',
      z.object({
        name: z.ostring(),
        type: z.enum(['dog', 'cat']).optional(),
      })
    ).openapi({
      discriminator: {
        propertyName: 'type',
      },
    });

    const DogSchema = registerSchema(
      'Dog',
      AnimalSchema.extend({
        type: z.string().openapi({ example: 'dog' }),
      })
    )
      .openapi({
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

  it.concurrent('treats objects created by .omit as a new object', () => {
    const BaseSchema = registerSchema(
      'Base',
      z.object({
        name: z.string(),
        type: z.enum(['dog', 'cat']).optional(),
      })
    );

    const OmittedSchema = BaseSchema.omit({ type: true });

    const OtherSchema = registerSchema(
      'Other',
      z.object({ omit: OmittedSchema })
    );

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

  it.concurrent('treats objects created by .pick as a new object', () => {
    const BaseSchema = registerSchema(
      'Base',
      z.object({
        name: z.string(),
        type: z.enum(['dog', 'cat']).optional(),
      })
    );

    const PickedSchema = BaseSchema.pick({ name: true });

    const OtherSchema = registerSchema(
      'Other',
      z.object({ pick: PickedSchema })
    );

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
