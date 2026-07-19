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

  it('supports nested discriminated unions', () => {
    const Circle = z
      .object({
        type: z.literal('circle'),
        radius: z.number(),
      })
      .openapi('Circle');

    const Rectangle = z
      .discriminatedUnion('kind', [
        z.object({
          type: z.literal('rectangle'),
          kind: z.literal('filled'),
          color: z.string(),
        }),
        z.object({
          type: z.literal('rectangle'),
          kind: z.literal('outlined'),
          borderWidth: z.number(),
        }),
      ])
      .openapi('Rectangle');

    expectSchema(
      [z.discriminatedUnion('type', [Circle, Rectangle]).openapi('Shape')],
      {
        Shape: {
          discriminator: {
            mapping: {
              circle: '#/components/schemas/Circle',
              rectangle: '#/components/schemas/Rectangle',
            },
            propertyName: 'type',
          },
          oneOf: [
            {
              $ref: '#/components/schemas/Circle',
            },
            {
              $ref: '#/components/schemas/Rectangle',
            },
          ],
        },
        Circle: {
          properties: {
            radius: {
              type: 'number',
            },
            type: {
              enum: ['circle'],
              type: 'string',
            },
          },
          required: ['type', 'radius'],
          type: 'object',
        },
        Rectangle: {
          oneOf: [
            {
              properties: {
                color: {
                  type: 'string',
                },
                kind: {
                  enum: ['filled'],
                  type: 'string',
                },
                type: {
                  enum: ['rectangle'],
                  type: 'string',
                },
              },
              required: ['type', 'kind', 'color'],
              type: 'object',
            },
            {
              properties: {
                borderWidth: {
                  type: 'number',
                },
                kind: {
                  enum: ['outlined'],
                  type: 'string',
                },
                type: {
                  enum: ['rectangle'],
                  type: 'string',
                },
              },
              required: ['type', 'kind', 'borderWidth'],
              type: 'object',
            },
          ],
        },
      }
    );
  });

  it('resolves enum discriminator values from within a nested discriminated union', () => {
    const Circle = z
      .object({ type: z.literal('circle'), radius: z.number() })
      .openapi('Circle');

    const Quadrilateral = z
      .discriminatedUnion('kind', [
        z.object({
          type: z.enum(['square', 'rectangle']),
          kind: z.literal('filled'),
          color: z.string(),
        }),
        z.object({
          type: z.enum(['square', 'rectangle']),
          kind: z.literal('outlined'),
          borderWidth: z.number(),
        }),
      ])
      .openapi('Quadrilateral');

    expectSchema(
      [z.discriminatedUnion('type', [Circle, Quadrilateral]).openapi('Shape')],
      {
        Shape: {
          discriminator: {
            propertyName: 'type',
            mapping: {
              circle: '#/components/schemas/Circle',
              square: '#/components/schemas/Quadrilateral',
              rectangle: '#/components/schemas/Quadrilateral',
            },
          },
          oneOf: [
            { $ref: '#/components/schemas/Circle' },
            { $ref: '#/components/schemas/Quadrilateral' },
          ],
        },
        Circle: {
          type: 'object',
          required: ['type', 'radius'],
          properties: {
            type: { type: 'string', enum: ['circle'] },
            radius: { type: 'number' },
          },
        },
        Quadrilateral: {
          oneOf: [
            {
              type: 'object',
              required: ['type', 'kind', 'color'],
              properties: {
                type: { type: 'string', enum: ['square', 'rectangle'] },
                kind: { type: 'string', enum: ['filled'] },
                color: { type: 'string' },
              },
            },
            {
              type: 'object',
              required: ['type', 'kind', 'borderWidth'],
              properties: {
                type: { type: 'string', enum: ['square', 'rectangle'] },
                kind: { type: 'string', enum: ['outlined'] },
                borderWidth: { type: 'number' },
              },
            },
          ],
        },
      }
    );
  });

  it('resolves discriminator values through two levels of nested discriminated unions', () => {
    const Circle = z.object({ type: z.literal('circle') }).openapi('Circle');

    const Rectangle = z
      .discriminatedUnion('kind', [
        z.discriminatedUnion('shade', [
          z.object({
            type: z.literal('rectangle'),
            kind: z.literal('filled'),
            shade: z.literal('solid'),
          }),
          z.object({
            type: z.literal('rectangle'),
            kind: z.literal('filled'),
            shade: z.literal('gradient'),
          }),
        ]),
        z.object({
          type: z.literal('rectangle'),
          kind: z.literal('outlined'),
        }),
      ])
      .openapi('Rectangle');

    expectSchema(
      [z.discriminatedUnion('type', [Circle, Rectangle]).openapi('Shape')],
      {
        Shape: {
          discriminator: {
            propertyName: 'type',
            mapping: {
              circle: '#/components/schemas/Circle',
              rectangle: '#/components/schemas/Rectangle',
            },
          },
          oneOf: [
            { $ref: '#/components/schemas/Circle' },
            { $ref: '#/components/schemas/Rectangle' },
          ],
        },
        Circle: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['circle'] },
          },
        },
        Rectangle: {
          oneOf: [
            {
              oneOf: [
                {
                  type: 'object',
                  required: ['type', 'kind', 'shade'],
                  properties: {
                    type: { type: 'string', enum: ['rectangle'] },
                    kind: { type: 'string', enum: ['filled'] },
                    shade: { type: 'string', enum: ['solid'] },
                  },
                },
                {
                  type: 'object',
                  required: ['type', 'kind', 'shade'],
                  properties: {
                    type: { type: 'string', enum: ['rectangle'] },
                    kind: { type: 'string', enum: ['filled'] },
                    shade: { type: 'string', enum: ['gradient'] },
                  },
                },
              ],
            },
            {
              type: 'object',
              required: ['type', 'kind'],
              properties: {
                type: { type: 'string', enum: ['rectangle'] },
                kind: { type: 'string', enum: ['outlined'] },
              },
            },
          ],
        },
      }
    );
  });

  it('omits mapping entries for non-string discriminator values', () => {
    const Text = z.object({ type: z.literal('text') }).openapi('obj1');
    const Version = z.object({ type: z.literal(1) }).openapi('obj2');

    expectSchema(
      [z.discriminatedUnion('type', [Text, Version]).openapi('Test')],
      {
        Test: {
          discriminator: {
            propertyName: 'type',
            mapping: {
              text: '#/components/schemas/obj1',
            },
          },
          oneOf: [
            { $ref: '#/components/schemas/obj1' },
            { $ref: '#/components/schemas/obj2' },
          ],
        },
        obj1: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['text'] },
          },
        },
        obj2: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'number', enum: [1] },
          },
        },
      }
    );
  });
});
