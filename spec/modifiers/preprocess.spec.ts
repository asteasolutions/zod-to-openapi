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
          .openapi({ refId: 'PreprocessedBoolean' }),
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
          .openapi({ refId: 'PreprocessedNumber' }),
      ],
      {
        PreprocessedNumber: {
          type: 'number',
        },
      }
    );
  });
});
