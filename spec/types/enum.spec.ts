import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('enum', () => {
  it('supports enums', () => {
    const schema = registerSchema(
      'Enum',
      z.enum(['option1', 'option2'])
    ).openapi({ description: 'All possible options' });

    expectSchema([schema], {
      Enum: {
        type: 'string',
        description: 'All possible options',
        enum: ['option1', 'option2'],
      },
    });
  });
});
