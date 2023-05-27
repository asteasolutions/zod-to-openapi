import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('null', () => {
  it('supports null in 3.0.0', () => {
    const schema = z.null().openapi('Null');

    expectSchema(
      [schema],
      {
        Null: {
          nullable: true,
        },
      },
      '3.0.0'
    );
  });

  it('supports null in 3.1.0', () => {
    const schema = z.null().openapi('Null');

    expectSchema(
      [schema],
      {
        Null: {
          type: 'null',
        },
      },
      '3.1.0'
    );
  });
});
