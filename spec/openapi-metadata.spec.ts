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

  it('can obtain overridden metadata', () => {
    const schema = z
      .string()
      .openapi({ description: 'Test' })
      .optional()
      .openapi({ deprecated: true })
      .nullable()
      .openapi({ example: 'test-example' })
      .default('test')
      .openapi({ maxLength: 40 });

    expect(OpenAPIMetadata.getOpenApiMetadata(schema)).toEqual({
      description: 'Test',
      deprecated: true,
      example: 'test-example',
      maxLength: 40,
    });
  });
});
