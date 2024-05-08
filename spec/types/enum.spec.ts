import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('enum', () => {
  it('supports enums', () => {
    const schema = z
      .enum(['option1', 'option2'])
      .openapi('Enum', { description: 'All possible options' });

    expectSchema([schema], {
      Enum: {
        type: 'string',
        description: 'All possible options',
        enum: ['option1', 'option2'],
      },
    });
  });

  it('does not contain multiple nullable values', () => {
    const schema = z.union([z.enum(['option1', 'option2']), z.null()]).openapi('Enum');

    expectSchema([schema], {
      Enum: {
        anyOf: [
          { enum: ['option1', 'option2'], type: 'string' },
          { nullable: true },
        ],
      },
    });
  });
});
