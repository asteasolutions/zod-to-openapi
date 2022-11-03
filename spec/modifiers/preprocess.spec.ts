import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('preprocess', () => {
  it.concurrent('supports preprocessed string -> boolean schema', () => {
    expectSchema(
      [
        registerSchema(
          'PreprocessedBoolean',
          z.preprocess(arg => {
            if (typeof arg === 'boolean') {
              return arg;
            }

            if (typeof arg === 'string') {
              if (arg === 'true') return true;
              if (arg === 'false') return false;
            }

            return undefined;
          }, z.boolean())
        ),
      ],
      {
        PreprocessedBoolean: {
          type: 'boolean',
        },
      }
    );
  });

  it.concurrent('supports preprocessed string -> number schema', () => {
    expectSchema(
      [
        registerSchema(
          'PreprocessedNumber',
          z.preprocess(arg => {
            if (typeof arg === 'number') {
              return arg;
            }

            if (typeof arg === 'string') {
              return parseInt(arg, 10);
            }

            return undefined;
          }, z.number())
        ),
      ],
      {
        PreprocessedNumber: {
          type: 'number',
        },
      }
    );
  });
});
