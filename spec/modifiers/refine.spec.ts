import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('refine', () => {
  it('supports refined schemas', () => {
    expectSchema(
      [
        registerSchema(
          'RefinedString',
          z.number().refine(num => num % 2 === 0)
        ),
      ],
      {
        RefinedString: {
          type: 'number',
        },
      }
    );
  });

  it('supports required refined schemas', () => {
    expectSchema(
      [
        registerSchema(
          'ObjectWithRefinedString',
          z.object({
            test: z.number().refine(num => num && num % 2 === 0),
          })
        ),
      ],
      {
        ObjectWithRefinedString: {
          type: 'object',
          properties: {
            test: {
              type: 'number',
            },
          },
          required: ['test'],
        },
      }
    );
  });

  it('supports optional refined schemas', () => {
    expectSchema(
      [
        registerSchema(
          'ObjectWithRefinedString',
          z.object({
            test: z.onumber().refine(num => num && num % 2 === 0),
          })
        ),
      ],
      {
        ObjectWithRefinedString: {
          type: 'object',
          properties: {
            test: {
              type: 'number',
            },
          },
        },
      }
    );
  });

  it('supports optional refined schemas with default', () => {
    expectSchema(
      [
        registerSchema(
          'Object',
          z.object({
            test: z
              .onumber()
              .refine(num => num && num % 2 === 0)
              .default(42),
          })
        ),
      ],
      {
        Object: {
          type: 'object',
          properties: {
            test: {
              type: 'number',
              default: 42,
            },
          },
        },
      }
    );
  });

  it('supports required refined schemas with default', () => {
    expectSchema(
      [
        registerSchema(
          'Object',
          z.object({
            test: z
              .number()
              .refine(num => num && num % 2 === 0)
              .default(42),
          })
        ),
      ],
      {
        Object: {
          type: 'object',
          properties: {
            test: {
              type: 'number',
              default: 42,
            },
          },
          required: ['test'],
        },
      }
    );
  });

  it('supports refined transforms when type is provided', () => {
    expectSchema(
      [
        registerSchema(
          'Object',
          z.object({
            test: z
              .string()
              .transform(value => value.trim())
              .refine(val => val.length >= 1, 'Value not set.')
              .openapi({
                type: 'string',
              }),
          })
        ),
      ],
      {
        Object: {
          type: 'object',
          properties: {
            test: {
              type: 'string',
            },
          },
          required: ['test'],
        },
      }
    );
  });
});
