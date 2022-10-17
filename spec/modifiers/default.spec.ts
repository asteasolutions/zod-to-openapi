import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('default', () => {
  it('supports defaults', () => {
    expectSchema(
      [z.string().default('test').openapi({ refId: 'StringWithDefault' })],
      {
        StringWithDefault: {
          type: 'string',
        },
      }
    );
  });

  it('supports optional defaults', () => {
    expectSchema(
      [
        z
          .object({
            test: z.ostring().default('test'),
          })
          .openapi({ refId: 'ObjectWithDefault' }),
      ],
      {
        ObjectWithDefault: {
          type: 'object',
          properties: {
            test: {
              type: 'string',
            },
          },
        },
      }
    );
  });

  it('supports required defaults', () => {
    expectSchema(
      [
        z
          .object({
            test: z.string().default('test'),
          })
          .openapi({ refId: 'ObjectWithDefault' }),
      ],
      {
        ObjectWithDefault: {
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

  it('supports required default schemas with refine', () => {
    expectSchema(
      [
        z
          .object({
            test: z
              .number()
              .default(42)
              .refine(num => num && num % 2 === 0),
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

  it('supports overriding default with .openapi', () => {
    expectSchema(
      [
        z
          .enum(['a', 'b'])
          .default('a')
          .openapi({ refId: 'EnumWithDefault', default: 'b', examples: ['b'] }),
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
