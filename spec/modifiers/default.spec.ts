import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('default', () => {
  it('supports defaults', () => {
    expectSchema([z.string().default('test').openapi('StringWithDefault')], {
      StringWithDefault: {
        type: 'string',
        default: 'test',
      },
    });
  });

  it('supports defaults override', () => {
    expectSchema(
      [
        z
          .string()
          .default('test')
          .default('override')
          .openapi('StringWithDefault'),
      ],
      {
        StringWithDefault: {
          type: 'string',
          default: 'override',
        },
      }
    );
  });

  it('supports falsy defaults', () => {
    expectSchema([z.boolean().default(false).openapi('BooleanWithDefault')], {
      BooleanWithDefault: {
        type: 'boolean',
        default: false,
      },
    });
  });

  it('supports optional defaults', () => {
    const schema = z
      .object({ test: z.ostring().default('test') })
      .openapi('ObjectWithDefault');

    expectSchema([schema], {
      ObjectWithDefault: {
        type: 'object',
        properties: {
          test: {
            type: 'string',
            default: 'test',
          },
        },
      },
    });
  });

  it('supports required types with defaults', () => {
    const schema = z
      .object({
        test: z.string().default('test'),
      })
      .openapi('ObjectWithDefault');

    expectSchema([schema], {
      ObjectWithDefault: {
        type: 'object',
        properties: {
          test: {
            type: 'string',
            default: 'test',
          },
        },
      },
    });
  });

  it('supports optional default schemas with refine', () => {
    expectSchema(
      [
        z
          .object({
            test: z
              .onumber()
              .default(42)
              .refine(num => num && num % 2 === 0),
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

  it('supports required types with default and refine', () => {
    expectSchema(
      [
        z
          .object({
            test: z
              .number()
              .default(42)
              .refine(num => num && num % 2 === 0),
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

  it('supports overriding default with .openapi', () => {
    expectSchema(
      [
        z
          .enum(['a', 'b'])
          .default('a')
          .openapi('EnumWithDefault', { default: 'b', examples: ['b'] }),
      ],
      {
        EnumWithDefault: {
          default: 'b',
          enum: ['a', 'b'],
          type: 'string',
          examples: ['b'],
        },
      }
    );
  });

  it('supports input type examples with default', () => {
    const example = {
      requiredField: 'required',
    };

    const schema = z
      .object({
        optionalField: z.string().default('defaultValue'),
        requiredField: z.string(),
      })
      // This throws an error if z.infer was used (as before)
      .openapi('TestTypescriptExample', { example });

    expectSchema([schema], {
      TestTypescriptExample: {
        type: 'object',
        properties: {
          optionalField: {
            type: 'string',
            default: 'defaultValue',
          },
          requiredField: {
            type: 'string',
          },
        },
        example: {
          requiredField: 'required',
        },
        required: ['requiredField'],
      },
    });
  });
});
