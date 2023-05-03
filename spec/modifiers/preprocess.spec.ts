import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('preprocess', () => {
  it('supports preprocessed string -> boolean schema', () => {
    expectSchema(
      [
        z
          .preprocess(arg => {
            if (typeof arg === 'boolean') {
              return arg;
            }

            if (typeof arg === 'string') {
              if (arg === 'true') return true;
              if (arg === 'false') return false;
            }

            return undefined;
          }, z.boolean())
          .openapi('PreprocessedBoolean'),
      ],
      {
        PreprocessedBoolean: {
          type: 'boolean',
        },
      }
    );
  });

  it('supports preprocessed string -> number schema', () => {
    expectSchema(
      [
        z
          .preprocess(arg => {
            if (typeof arg === 'number') {
              return arg;
            }

            if (typeof arg === 'string') {
              return parseInt(arg, 10);
            }

            return undefined;
          }, z.number())
          .openapi('PreprocessedNumber'),
      ],
      {
        PreprocessedNumber: {
          type: 'number',
        },
      }
    );
  });

  // TODO: This test should probably be made to work.
  it.skip('can automatically register schemas in preprocess', () => {
    const schema = z
      .preprocess(arg => {
        if (typeof arg === 'boolean') {
          return arg;
        }

        if (typeof arg === 'string') {
          if (arg === 'true') return true;
          if (arg === 'false') return false;
        }

        return undefined;
      }, z.boolean().openapi('PlainBoolean'))
      .openapi('PreprocessedBoolean');

    expectSchema([schema], {
      PlainBoolean: {
        type: 'boolean',
      },
      PreprocessedBoolean: {
        type: 'boolean',
      },
    });
  });
});
