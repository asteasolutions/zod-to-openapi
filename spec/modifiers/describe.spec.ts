import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('describe', () => {
  it('generates OpenAPI schema with description when the .describe method is used', () => {
    const schema = registerSchema(
      'SimpleString',
      z.string().describe('This is a test string')
    );

    expectSchema([schema], {
      SimpleString: { type: 'string', description: 'This is a test string' },
    });
  });

  it('can overload .openapi description when the .describe method is used', () => {
    const schema = registerSchema(
      'SimpleString',
      z
        .string()
        .openapi({ description: 'Alternative description' })
        .describe('This is a test string')
    );

    expectSchema([schema], {
      SimpleString: { type: 'string', description: 'This is a test string' },
    });
  });

  it('can overload descriptions from .describe with .openapi', () => {
    const schema = registerSchema(
      'SimpleString',
      z
        .string()
        .describe('This is a test string')
        .openapi({ description: 'Alternative description' })
    );

    expectSchema([schema], {
      SimpleString: { type: 'string', description: 'Alternative description' },
    });
  });
});
