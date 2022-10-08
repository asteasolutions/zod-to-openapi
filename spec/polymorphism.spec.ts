import * as z from 'zod';
import { expectSchema } from './lib/helpers';

describe('Polymorphism', () => {
  it('can use allOf for extended schemas', () => {
    const BaseSchema = z.object({ id: z.string() }).openapi({
      refId: 'Base',
    });

    const ExtendedSchema = BaseSchema.extend({
      bonus: z.number(),
    }).openapi({
      refId: 'Extended',
    });

    expectSchema([BaseSchema, ExtendedSchema], {
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

  it('can apply nullable', () => {
    const BaseSchema = z.object({ id: z.ostring() }).openapi({
      refId: 'Base',
    });

    const ExtendedSchema = BaseSchema.extend({
      bonus: z.onumber(),
    })
      .nullable()
      .openapi({
        refId: 'Extended',
      });

    expectSchema([BaseSchema, ExtendedSchema], {
      Base: {
        type: 'object',
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
            properties: {
              bonus: {
                type: 'number',
              },
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

  it('treats objects created by .omit as a new object', () => {
    const BaseSchema = z
      .object({
        name: z.string(),
        type: z.enum(['dog', 'cat']).optional(),
      })
      .openapi({
        refId: 'Base',
      });

    const OmittedSchema = BaseSchema.omit({ type: true });

    const OtherSchema = z
      .object({ omit: OmittedSchema })
      .openapi({ refId: 'Other' });

    expectSchema([BaseSchema, OtherSchema], {
      Base: {
        properties: {
          name: {
            type: 'string',
          },
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
              name: {
                type: 'string',
              },
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
      .openapi({
        refId: 'Base',
      });

    const PickedSchema = BaseSchema.pick({ name: true });

    const OtherSchema = z
      .object({ pick: PickedSchema })
      .openapi({ refId: 'Other' });

    expectSchema([BaseSchema, OtherSchema], {
      Base: {
        properties: {
          name: {
            type: 'string',
          },
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
              name: {
                type: 'string',
              },
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
