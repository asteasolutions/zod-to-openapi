import {
  OpenAPIGenerator,
  OpenAPIObjectConfig,
  OpenApiVersion,
} from '../../src/openapi-generator';
import type {
  ComponentsObject,
  OperationObject,
  SchemasObject,
} from 'openapi3-ts';
import type { ZodSchema } from 'zod';
import {
  OpenAPIDefinitions,
  OpenAPIRegistry,
  RouteConfig,
} from '../../src/openapi-registry';

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

export function registerParameter<T extends ZodSchema<any>>(
  refId: string,
  zodSchema: T
) {
  const registry = new OpenAPIRegistry();

  const schema = registry.registerParameter(refId, zodSchema);

  return { type: 'parameter', schema } as const;
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

export function generateDataForRoute(
  props: Partial<RouteConfig> = {},
  additionalDefinitions: OpenAPIDefinitions[] = []
): OperationObject & {
  documentSchemas: ComponentsObject['schemas'];
  documentParameters: ComponentsObject['parameters'];
} {
  const route = createTestRoute(props);

  const routeDefinition = {
    type: 'route' as const,
    route,
  };

  const { paths, components } = new OpenAPIGenerator(
    [...additionalDefinitions, routeDefinition],
    '3.0.0'
  ).generateDocument(testDocConfig);

  const routeDoc = paths[route.path][route.method] as OperationObject;

  return {
    documentSchemas: components?.schemas,
    documentParameters: components?.parameters,
    ...routeDoc,
  };
}
