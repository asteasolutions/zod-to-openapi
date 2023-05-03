import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('describe', () => {
  it('generates OpenAPI schema with description when the .describe method is used', () => {
    const schema = z
      .string()
      .describe('This is a test string')
      .openapi('SimpleString');

    expectSchema([schema], {
      SimpleString: { type: 'string', description: 'This is a test string' },
    });
  });

  it('can get description from a schema made optional', () => {
    const schema = z
      .string()
      .describe('This is a test string')
      .optional()
      .openapi('SimpleString');

    expectSchema([schema], {
      SimpleString: { type: 'string', description: 'This is a test string' },
    });
  });

  it('can get description from an optional schema', () => {
    const schema = z
      .string()
      .optional()
      .describe('This is a test string')
      .openapi('SimpleString');

    expectSchema([schema], {
      SimpleString: { type: 'string', description: 'This is a test string' },
    });
  });

  it('can overload descriptions from .describe with .openapi', () => {
    const schema = z
      .string()
      .describe('This is a test string')
      .openapi('SimpleString', { description: 'Alternative description' });

    expectSchema([schema], {
      SimpleString: {
        type: 'string',
        description: 'Alternative description',
      },
    });
  });

  it('can use nested descriptions from .describe with .openapi', () => {
    const schema = z
      .object({
        type: z.string().describe('Just a type'),
        title: z.string().describe('Just a title').optional(),
      })
      .describe('Whole object')
      .openapi('Test');

    expectSchema([schema], {
      Test: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Just a type',
          },
          title: {
            type: 'string',
            description: 'Just a title',
          },
        },
        required: ['type'],
        description: 'Whole object',
      },
    });
  });
});
