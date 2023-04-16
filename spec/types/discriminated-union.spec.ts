import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypes,
} from '../lib/helpers';

registrationTypes.forEach(registrationType => {
  describe('discriminated union', () => {
    it('supports basic discriminated unions', () => {
      const Text = z.object({ type: z.literal('text'), text: z.string() });
      const Image = z.object({ type: z.literal('image'), src: z.string() });

      expectSchema(
        [
          registerSchema(
            'Test',
            z.discriminatedUnion('type', [Text, Image]),
            registrationType
          ),
        ],
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
      const Text = registerSchema(
        'obj1',
        z.object({ type: z.literal('text'), text: z.string() }),
        registrationType
      );
      const Image = registerSchema(
        'obj2',
        z.object({ type: z.literal('image'), src: z.string() }),
        registrationType
      );

      expectSchema(
        [
          Text,
          Image,
          registerSchema(
            'Test',
            z.discriminatedUnion('type', [Text, Image]),
            registrationType
          ),
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
      const Text = registerSchema(
        'obj1',
        z.object({ type: z.enum(['text', 'other']), text: z.string() }),
        registrationType
      );
      const Image = registerSchema(
        'obj2',
        z.object({ type: z.literal('image'), src: z.string() }),
        registrationType
      );

      expectSchema(
        [
          Text,
          Image,
          registerSchema(
            'Test',
            z.discriminatedUnion('type', [Text, Image]),
            registrationType
          ),
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
      const Text = registerSchema(
        'obj1',
        z.object({ type: z.literal('text'), text: z.string() }),
        registrationType
      );
      const Image = registerSchema(
        'obj2',
        z.object({ type: z.literal('image'), src: z.string() }),
        registrationType
      );

      expectSchema(
        [
          Text,
          Image,
          registerSchema(
            'Test',
            z.discriminatedUnion('type', [Text, Image]).nullable(),
            registrationType
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
    });

    it('does not create a discriminator mapping when only some objects in the discriminated union contain a registered schema', () => {
      const Text = registerSchema(
        'obj1',
        z.object({ type: z.literal('text'), text: z.string() }),
        registrationType
      );
      const Image = z.object({ type: z.literal('image'), src: z.string() });

      expectSchema(
        [
          Text,
          Image,
          registerSchema(
            'Test',
            z.discriminatedUnion('type', [Text, Image]),
            registrationType
          ),
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
  });
});
