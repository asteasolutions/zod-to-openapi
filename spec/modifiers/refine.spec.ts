import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('refine', () => {
  it('supports refined schemas', () => {
    expectSchema(
      [
        z
          .number()
          .refine(num => num % 2 === 0)
          .openapi('RefinedString'),
      ],
      {
        RefinedString: {
          type: 'number',
        },
      }
    );
  });

  it('does not lose metadata from refine', () => {
    expectSchema(
      [
        z
          .number()
          .openapi({ example: 42 })
          .refine(num => num % 2 === 0)
          .openapi('RefinedString'),
      ],
      {
        RefinedString: {
          type: 'number',
          example: 42,
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
          .openapi('ObjectWithRefinedString'),
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
            test: z
              .number()
              .optional()
              .refine(num => !num || num % 2 === 0),
          })
          .openapi('ObjectWithRefinedString'),
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
              .number()
              .optional()
              .refine(num => num && num % 2 === 0)
              .default(42),
          })
          .openapi('Object'),
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

  it('supports required type schemas with refine and default', () => {
    expectSchema(
      [
        z
          .object({
            test: z
              .number()
              .refine(num => num && num % 2 === 0)
              .default(42),
          })
          .openapi('Object'),
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
          .openapi('Object'),
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

  // TODO: This test should probably be made to work.
  it.skip('can automatically register schemas in refine', () => {
    const schema = z
      .string()
      .openapi('PlainString')
      .refine(data => data.length > 3)
      .openapi('RefinedString');

    expectSchema([schema], {
      PlainString: {
        type: 'string',
      },
      RefinedString: {
        type: 'string',
      },
    });
  });
});
