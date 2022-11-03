import { getOpenApiMetadata } from '../src/openapi-metadata';
import { z } from 'zod';

describe('OpenAPI metadata', () => {
  it.concurrent('can obtain nested metadata', () => {
    const schema = z
      .string()
      .openapi({ description: 'Test', deprecated: true })
      .optional()
      .nullable()
      .default('test');

    expect(getOpenApiMetadata(schema)).toEqual({
      description: 'Test',
      deprecated: true,
    });
  });

  it.concurrent('can obtain overridden metadata', () => {
    const schema = z
      .string()
      .openapi({ description: 'Test' })
      .optional()
      .openapi({ deprecated: true })
      .nullable()
      .openapi({ example: 'test-example' })
      .default('test')
      .openapi({ maxLength: 40 });

    expect(getOpenApiMetadata(schema)).toEqual({
      description: 'Test',
      deprecated: true,
      example: 'test-example',
      maxLength: 40,
    });
  });
});
