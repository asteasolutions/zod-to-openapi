import {
  OpenAPIGenerator,
  OpenAPIObjectConfig,
  OpenApiVersion,
} from '../../src/openapi-generator';
import type { SchemasObject } from 'openapi3-ts/oas30';
import type { ZodSchema } from 'zod';
import { OpenAPIRegistry, RouteConfig } from '../../src/openapi-registry';

export function createSchemas(
  zodSchemas: ZodSchema<any>[],
  openApiVersion: OpenApiVersion = '3.0.0'
) {
  const definitions = zodSchemas.map(schema => ({
    type: 'schema' as const,
    schema,
  }));

  const { components } = new OpenAPIGenerator(
    definitions,
    openApiVersion
  ).generateComponents();

  return components;
}

export function expectSchema(
  zodSchemas: ZodSchema<any>[],
  openAPISchemas: SchemasObject,
  openApiVersion: OpenApiVersion = '3.0.0'
) {
  const components = createSchemas(zodSchemas, openApiVersion);

  expect(components?.['schemas']).toEqual(openAPISchemas);
}

export function registerSchema<T extends ZodSchema<any>>(
  refId: string,
  zodSchema: T
): T {
  const registry = new OpenAPIRegistry();

  return registry.register(refId, zodSchema);
}

export function createTestRoute(props: Partial<RouteConfig> = {}): RouteConfig {
  return {
    method: 'get',
    path: '/',
    responses: {
      200: {
        description: 'OK Response',
      },
    },
    ...props,
  };
}

export const testDocConfig: OpenAPIObjectConfig = {
  info: {
    version: '1.0.0',
    title: 'Swagger Petstore',
    description: 'A sample API',
    termsOfService: 'http://swagger.io/terms/',
    license: {
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
    },
  },
  servers: [{ url: 'v1' }],
};
