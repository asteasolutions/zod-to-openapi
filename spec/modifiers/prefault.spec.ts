import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('prefault', () => {
  it('supports prefault values', () => {
    const schema = z
      .string()
      .prefault('prefaulted')
      .openapi('StringWithPrefault');

    expectSchema([schema], {
      StringWithPrefault: {
        type: 'string',
        default: 'prefaulted',
      },
    });
  });

  it('supports default overriding prefault for openapi default', () => {
    const schema = z
      .string()
      .default('defaulted')
      .prefault('prefaulted')
      .openapi('StringWithPrefaultAndDefault');

    expectSchema([schema], {
      StringWithPrefaultAndDefault: {
        type: 'string',
        default: 'defaulted',
      },
    });
  });

  it('supports default when prefault is not present', () => {
    const schema = z.string().default('defaulted').openapi('StringWithDefault');

    expectSchema([schema], {
      StringWithDefault: {
        type: 'string',
        default: 'defaulted',
      },
    });
  });
});
