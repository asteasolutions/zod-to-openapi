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

  it('supports nullable enums', () => {
    const schema = z
      .enum(['option1', 'option2'])
      .nullable()
      .openapi('Enum', { description: 'All possible options' });

    expectSchema([schema], {
      Enum: {
        type: 'string',
        nullable: true,
        description: 'All possible options',
        enum: ['option1', 'option2', null],
      },
    });
  });
});
