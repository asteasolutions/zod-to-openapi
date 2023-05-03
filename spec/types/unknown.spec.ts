import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('unknown', () => {
  it('supports unknown', () => {
    expectSchema(
      [z.unknown().openapi('Unknown', { description: 'Something unknown' })],
      {
        Unknown: { description: 'Something unknown' },
      }
    );
  });
});
