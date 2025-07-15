import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('transform', () => {
  it('does support transformed schemas', () => {
    expectSchema(
      [
        z
          .number()
          .transform(num => num.toString())
          .openapi('Transformed'),
      ],
      {
        Transformed: {
          type: 'number',
        },
      }
    );
  });

  it('does not lose metadata from transform', () => {
    expectSchema(
      [
        z
          .number()
          .openapi({ example: 42 })
          .transform(num => num.toString())
          .openapi('Transformed'),
      ],
      {
        Transformed: {
          type: 'number',
          example: 42,
        },
      }
    );
  });

  it('supports input type examples with transform', () => {
    const schema = z
      .string()
      .transform(val => val.length)
      .openapi('TestTypescriptExample', { example: '123' });

    expectSchema([schema], {
      TestTypescriptExample: {
        type: 'string',
        example: '123',
      },
    });
  });
});
