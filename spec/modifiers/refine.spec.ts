import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('refine', () => {
  it('supports refined schemas', () => {
    expectSchema(
      [
        z
          .number()
          .refine(num => num % 2 === 0)
          .openapi({ refId: 'RefinedString' }),
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
        z
          .object({
            test: z.number().refine(num => num && num % 2 === 0),
          })
          .openapi({ refId: 'ObjectWithRefinedString' }),
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
        z
          .object({
            test: z.onumber().refine(num => num && num % 2 === 0),
          })
          .openapi({ refId: 'ObjectWithRefinedString' }),
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
        z
          .object({
            test: z
              .onumber()
              .refine(num => num && num % 2 === 0)
              .default(42),
          })
          .openapi({ refId: 'Object' }),
      ],
      {
        Object: {
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

  it('supports required refined schemas with default', () => {
    expectSchema(
      [
        z
          .object({
            test: z
              .number()
              .refine(num => num && num % 2 === 0)
              .default(42),
          })
          .openapi({ refId: 'Object' }),
      ],
      {
        Object: {
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

  it('supports refined transforms when type is provided', () => {
    expectSchema(
      [
        z
          .object({
            test: z
              .string()
              .transform(value => value.trim())
              .refine(val => val.length >= 1, 'Value not set.')
              .openapi({
                type: 'string',
              }),
          })
          .openapi({ refId: 'Object' }),
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
