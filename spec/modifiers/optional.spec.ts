import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('optional', () => {
  it.concurrent(
    'generates OpenAPI schema for optional after the metadata',
    () => {
      expectSchema([registerSchema('SimpleString', z.string()).optional()], {
        SimpleString: { type: 'string' },
      });
    }
  );

  it.concurrent(
    'generates OpenAPI schema for optional before the metadata',
    () => {
      expectSchema([registerSchema('SimpleString', z.string()).optional()], {
        SimpleString: { type: 'string' },
      });
    }
  );

  it.concurrent('supports optional nullable', () => {
    expectSchema(
      [
        registerSchema(
          'SimpleObject',
          z.object({
            test: z.string().nullable().optional(),
          })
        ),
      ],
      {
        SimpleObject: {
          type: 'object',
          properties: {
            test: {
              nullable: true,
              type: 'string',
            },
          },
        },
      }
    );
  });
});
