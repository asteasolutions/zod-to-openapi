import { z } from 'zod/v4';
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
});
