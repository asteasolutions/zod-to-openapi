import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

// Based on the "Any Type" section of https://swagger.io/docs/specification/data-models/data-types/

describe('unknown', () => {
  it('supports unknown for 3.0.0 ', () => {
    expectSchema(
      [z.unknown().openapi('Unknown', { description: 'Something unknown' })],
      {
        Unknown: { description: 'Something unknown', nullable: true },
      }
    );
  });

  it('supports unknown for 3.1.0', () => {
    expectSchema(
      [z.unknown().openapi('Unknown', { description: 'Something unknown' })],
      {
        Unknown: { description: 'Something unknown' },
      },
      '3.1.0'
    );
  });
});
