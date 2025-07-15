import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('discriminated union', () => {
  it('supports basic discriminated unions', () => {
    const Text = z.object({ type: z.literal('text'), text: z.string() });
    const Image = z.object({ type: z.literal('image'), src: z.string() });

    expectSchema(
      [z.discriminatedUnion('type', [Text, Image]).openapi('Test')],
      {
        Test: {
          oneOf: [
            {
              type: 'object',
              required: ['type', 'text'],
              properties: {
                type: { type: 'string', enum: ['text'] },
                text: { type: 'string' },
              },
            },
            {
              type: 'object',
              required: ['type', 'src'],
              properties: {
                type: { type: 'string', enum: ['image'] },
                src: { type: 'string' },
              },
            },
          ],
        },
      }
    );
  });

  it('creates a discriminator mapping when all objects in the discriminated union contain a registered schema', () => {
    const Text = z
      .object({ type: z.literal('text'), text: z.string() })
      .openapi('obj1');
    const Image = z
      .object({ type: z.literal('image'), src: z.string() })
      .openapi('obj2');

    expectSchema(
      [
        Text,
        Image,
        z.discriminatedUnion('type', [Text, Image]).openapi('Test'),
      ],
      {
        Test: {
          oneOf: [
            { $ref: '#/components/schemas/obj1' },
            { $ref: '#/components/schemas/obj2' },
          ],
          discriminator: {
            propertyName: 'type',
            mapping: {
              text: '#/components/schemas/obj1',
              image: '#/components/schemas/obj2',
            },
          },
        },
        obj1: {
          type: 'object',
          required: ['type', 'text'],
          properties: {
            type: { type: 'string', enum: ['text'] },
            text: { type: 'string' },
          },
        },
        obj2: {
          type: 'object',
          required: ['type', 'src'],
          properties: {
            type: { type: 'string', enum: ['image'] },
            src: { type: 'string' },
          },
        },
      }
    );
  });

  it('creates a discriminator mapping when a registered object uses a zodEnum as the discriminator', () => {
    const Text = z
      .object({ type: z.enum(['text', 'other']), text: z.string() })
      .openapi('obj1');
    const Image = z
      .object({ type: z.literal('image'), src: z.string() })
      .openapi('obj2');

    expectSchema(
      [
        Text,
        Image,
        z.discriminatedUnion('type', [Text, Image]).openapi('Test'),
      ],
      {
        Test: {
          oneOf: [
            { $ref: '#/components/schemas/obj1' },
            { $ref: '#/components/schemas/obj2' },
          ],
          discriminator: {
            propertyName: 'type',
            mapping: {
              text: '#/components/schemas/obj1',
              other: '#/components/schemas/obj1',
              image: '#/components/schemas/obj2',
            },
          },
        },
        obj1: {
          type: 'object',
          required: ['type', 'text'],
          properties: {
            type: { type: 'string', enum: ['text', 'other'] },
            text: { type: 'string' },
          },
        },
        obj2: {
          type: 'object',
          required: ['type', 'src'],
          properties: {
            type: { type: 'string', enum: ['image'] },
            src: { type: 'string' },
          },
        },
      }
    );
  });

  it('does not create a discriminator mapping when the discrimnated union is nullable', () => {
    const Text = z
      .object({ type: z.literal('text'), text: z.string() })
      .openapi('obj1');
    const Image = z
      .object({ type: z.literal('image'), src: z.string() })
      .openapi('obj2');

    expectSchema(
      [
        Text,
        Image,
        z.discriminatedUnion('type', [Text, Image]).nullable().openapi('Test'),
      ],
      {
        Test: {
          oneOf: [
            { $ref: '#/components/schemas/obj1' },
            { $ref: '#/components/schemas/obj2' },
            { nullable: true },
          ],
        },
        obj1: {
          type: 'object',
          required: ['type', 'text'],
          properties: {
            type: { type: 'string', enum: ['text'] },
            text: { type: 'string' },
          },
        },
        obj2: {
          type: 'object',
          required: ['type', 'src'],
          properties: {
            type: { type: 'string', enum: ['image'] },
            src: { type: 'string' },
          },
        },
      }
    );
  });

  it('does not create a discriminator mapping when only some objects in the discriminated union contain a registered schema', () => {
    const Text = z
      .object({ type: z.literal('text'), text: z.string() })
      .openapi('obj1');
    const Image = z.object({ type: z.literal('image'), src: z.string() });

    expectSchema(
      [
        Text,
        Image,
        z.discriminatedUnion('type', [Text, Image]).openapi('Test'),
      ],
      {
        Test: {
          oneOf: [
            { $ref: '#/components/schemas/obj1' },
            {
              type: 'object',
              required: ['type', 'src'],
              properties: {
                type: { type: 'string', enum: ['image'] },
                src: { type: 'string' },
              },
            },
          ],
        },
        obj1: {
          type: 'object',
          required: ['type', 'text'],
          properties: {
            type: { type: 'string', enum: ['text'] },
            text: { type: 'string' },
          },
        },
      }
    );
  });

  it('can automatically register discriminated union items', () => {
    const schema = z
      .discriminatedUnion('type', [
        z.object({ type: z.literal('dog').openapi('DogType') }).openapi('Dog'),
        z.object({ type: z.literal('cat').openapi('CatType') }),
      ])
      .openapi('DiscriminatedUnion');

    expectSchema([schema], {
      DogType: {
        type: 'string',
        enum: ['dog'],
      },

      CatType: {
        type: 'string',
        enum: ['cat'],
      },

      Dog: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { $ref: '#/components/schemas/DogType' },
        },
      },

      DiscriminatedUnion: {
        oneOf: [
          { $ref: '#/components/schemas/Dog' },
          {
            type: 'object',
            required: ['type'],
            properties: {
              type: { $ref: '#/components/schemas/CatType' },
            },
          },
        ],
      },
    });
  });
});
