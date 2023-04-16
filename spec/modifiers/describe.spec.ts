import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypeDescribe,
} from '../lib/helpers';

registrationTypeDescribe('describe', registrationType => {
  it('generates OpenAPI schema with description when the .describe method is used', () => {
    const schema = registerSchema(
      'SimpleString',
      z.string().describe('This is a test string'),
      registrationType
    );

    expectSchema([schema], {
      SimpleString: { type: 'string', description: 'This is a test string' },
    });
  });

  it('can get description from a schema made optional', () => {
    const schema = registerSchema(
      'SimpleString',
      z.string().describe('This is a test string').optional(),
      registrationType
    );

    expectSchema([schema], {
      SimpleString: { type: 'string', description: 'This is a test string' },
    });
  });

  it('can get description from an optional schema', () => {
    const schema = registerSchema(
      'SimpleString',
      z.string().optional().describe('This is a test string'),
      registrationType
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
        .openapi({ description: 'Alternative description' }),
      registrationType
    );

    expectSchema([schema], {
      SimpleString: {
        type: 'string',
        description: 'Alternative description',
      },
    });
  });

  it('can use nested descriptions from .describe with .openapi', () => {
    const schema = registerSchema(
      'Test',
      z
        .object({
          type: z.string().describe('Just a type'),
          title: z.string().describe('Just a title').optional(),
        })
        .describe('Whole object'),
      registrationType
    );

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
