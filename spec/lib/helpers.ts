import { OpenAPIGenerator, OpenApiVersion } from '../../src/openapi-generator';
import type { SchemasObject } from 'openapi3-ts';
import type { ZodSchema } from 'zod';

export function createSchemas(
  zodSchemas: ZodSchema<any>[],
  openapi: OpenApiVersion = '3.0.0'
) {
  const definitions = zodSchemas.map(schema => ({
    type: 'schema' as const,
    schema,
  }));

  const { components } = new OpenAPIGenerator(definitions).generateComponents({
    openapi,
  });

  return components;
}

export function expectSchema(
  zodSchemas: ZodSchema<any>[],
  openAPISchemas: SchemasObject,
  openapi: OpenApiVersion = '3.0.0'
) {
  const components = createSchemas(zodSchemas, openapi);

  expect(components?.['schemas']).toEqual(openAPISchemas);
}
