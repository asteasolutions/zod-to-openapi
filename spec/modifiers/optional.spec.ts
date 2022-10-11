import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('optional', () => {
  it('generates OpenAPI schema for optional after the metadata', () => {
    expectSchema([z.string().openapi({ refId: 'SimpleString' }).optional()], {
      // TODO: Um, where is the optional?
      SimpleString: { type: 'string' },
    });
  });

  it('generates OpenAPI schema for optional before the metadata', () => {
    expectSchema([z.string().optional().openapi({ refId: 'SimpleString' })], {
      // TODO: Um, where is the optional?
      SimpleString: { type: 'string' },
    });
  });
});
