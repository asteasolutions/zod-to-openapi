import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('optional', () => {
  it('generates OpenAPI schema for optional after the metadata', () => {
    expectSchema([z.string().openapi({ refId: 'SimpleString' }).optional()], {
      SimpleString: { type: 'string' },
    });
  });

  it('generates OpenAPI schema for optional before the metadata', () => {
    expectSchema([z.string().optional().openapi({ refId: 'SimpleString' })], {
      SimpleString: { type: 'string' },
    });
  });
});
