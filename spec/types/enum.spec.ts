import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('enum', () => {
  it('supports enums', () => {
    const schema = z.enum(['option1', 'option2']).openapi({
      refId: 'Enum',
      description: 'All possible options',
      default: 'option2',
      examples: ['option2'],
    });

    expectSchema([schema], {
      Enum: {
        type: 'string',
        description: 'All possible options',
        enum: ['option1', 'option2'],
        default: 'options2',
        examples: ['option2'],
      },
    });
  });
});
