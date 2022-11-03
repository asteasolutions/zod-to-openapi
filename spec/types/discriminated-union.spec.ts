import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('discriminated union', () => {
  it.concurrent('supports basic discriminated unions', () => {
    const Text = z.object({ type: z.literal('text'), text: z.string() });
    const Image = z.object({ type: z.literal('image'), src: z.string() });

    expectSchema(
      [registerSchema('Test', z.discriminatedUnion('type', [Text, Image]))],
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

  it.concurrent(
    'creates a discriminator mapping when all objects in the discriminated union contain a registered schema',
    () => {
      const Text = registerSchema(
        'obj1',
        z.object({ type: z.literal('text'), text: z.string() })
      );
      const Image = registerSchema(
        'obj2',
        z.object({ type: z.literal('image'), src: z.string() })
      );

      expectSchema(
        [
          Text,
          Image,
          registerSchema('Test', z.discriminatedUnion('type', [Text, Image])),
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
    }
  );

  it.concurrent(
    'does not create a discriminator mapping when the discrimnated union is nullable',
    () => {
      const Text = registerSchema(
        'obj1',
        z.object({ type: z.literal('text'), text: z.string() })
      );
      const Image = registerSchema(
        'obj2',
        z.object({ type: z.literal('image'), src: z.string() })
      );

      expectSchema(
        [
          Text,
          Image,
          registerSchema(
            'Test',
            z.discriminatedUnion('type', [Text, Image]).nullable()
          ),
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
    }
  );

  it.concurrent(
    'does not create a discriminator mapping when only some objects in the discriminated union contain a registered schema',
    () => {
      const Text = registerSchema(
        'obj1',
        z.object({ type: z.literal('text'), text: z.string() })
      );
      const Image = z.object({ type: z.literal('image'), src: z.string() });

      expectSchema(
        [
          Text,
          Image,
          registerSchema('Test', z.discriminatedUnion('type', [Text, Image])),
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
    }
  );
});
