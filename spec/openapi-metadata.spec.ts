import { OpenAPIMetadata } from '../src/openapi-metadata';
import { z } from 'zod';

describe('OpenAPI metadata', () => {
  it('can obtain nested metadata', () => {
    const schema = z
      .string()
      .openapi({ description: 'Test', deprecated: true })
      .optional()
      .nullable()
      .default('test');

    expect(OpenAPIMetadata.getOpenApiMetadata(schema)).toEqual({
      description: 'Test',
      deprecated: true,
    });
  });
});
