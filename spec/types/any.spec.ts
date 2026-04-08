import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

// Based on the "Any Type" section of https://swagger.io/docs/specification/data-models/data-types/

describe('any', () => {
  it('supports any for 3.0.0 ', () => {
    expectSchema([z.any().openapi('Any', { description: 'Something' })], {
      Any: { description: 'Something', nullable: true },
    });
  });

  it('supports any for 3.1.0', () => {
    expectSchema(
      [z.any().openapi('Any', { description: 'Something' })],
      {
        Any: { description: 'Something' },
      },
      { version: '3.1.0' }
    );
  });
});
