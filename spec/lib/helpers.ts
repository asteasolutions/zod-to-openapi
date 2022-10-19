import { OpenAPIGenerator } from '../../src/openapi-generator';
import type { SchemasObject } from 'openapi3-ts';
import type { ZodSchema } from 'zod';

export function createSchemas(
  zodSchemas: ZodSchema<any>[],
  openAPIVersion?: string
) {
  const definitions = zodSchemas.map(schema => ({
    type: 'schema' as const,
    schema,
  }));

  const { components } = new OpenAPIGenerator(definitions).generateComponents(
    openAPIVersion
  );

  return components;
}

export function expectSchema(
  zodSchemas: ZodSchema<any>[],
  openAPISchemas: SchemasObject,
  openAPIVersion?: string
) {
  const components = createSchemas(zodSchemas, openAPIVersion);

  expect(components?.['schemas']).toEqual(openAPISchemas);
}
