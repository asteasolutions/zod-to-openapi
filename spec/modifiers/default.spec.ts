import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('default', () => {
  it.concurrent('supports defaults', () => {
    expectSchema(
      [registerSchema('StringWithDefault', z.string().default('test'))],
      {
        StringWithDefault: {
          type: 'string',
          default: 'test',
        },
      }
    );
  });

  it.concurrent('supports defaults override', () => {
    expectSchema(
      [
        registerSchema(
          'StringWithDefault',
          z.string().default('test').default('override')
        ),
      ],
      {
        StringWithDefault: {
          type: 'string',
          default: 'override',
        },
      }
    );
  });

  it.concurrent('supports falsy defaults', () => {
    expectSchema(
      [registerSchema('BooleanWithDefault', z.boolean().default(false))],
      {
        BooleanWithDefault: {
          type: 'boolean',
          default: false,
        },
      }
    );
  });

  it.concurrent('supports optional defaults', () => {
    expectSchema(
      [
        registerSchema(
          'ObjectWithDefault',
          z.object({
            test: z.ostring().default('test'),
          })
        ),
      ],
      {
        ObjectWithDefault: {
          type: 'object',
          properties: {
            test: {
              type: 'string',
              default: 'test',
            },
          },
        },
      }
    );
  });

  it.concurrent('supports required defaults', () => {
    expectSchema(
      [
        registerSchema(
          'ObjectWithDefault',
          z.object({
            test: z.string().default('test'),
          })
        ),
      ],
      {
        ObjectWithDefault: {
          type: 'object',
          properties: {
            test: {
              type: 'string',
              default: 'test',
            },
          },
          required: ['test'],
        },
      }
    );
  });

  it.concurrent('supports optional default schemas with refine', () => {
    expectSchema(
      [
        registerSchema(
          'Object',
          z.object({
            test: z
              .onumber()
              .default(42)
              .refine(num => num && num % 2 === 0),
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

  it.concurrent('supports required default schemas with refine', () => {
    expectSchema(
      [
        registerSchema(
          'Object',
          z.object({
            test: z
              .number()
              .default(42)
              .refine(num => num && num % 2 === 0),
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

  it.concurrent('supports overriding default with .openapi', () => {
    expectSchema(
      [
        registerSchema(
          'EnumWithDefault',
          z.enum(['a', 'b']).default('a')
        ).openapi({ default: 'b', examples: ['b'] }),
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
});
