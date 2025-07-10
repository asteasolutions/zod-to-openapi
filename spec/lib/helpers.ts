import type {
  ComponentsObject,
  OperationObject,
  SchemasObject as SchemasObjectV30,
} from 'openapi3-ts/oas30'
import type { SchemasObject as SchemasObjectV31 } from 'openapi3-ts/oas31'
import type { ZodType } from 'zod'
import {
  OpenAPIDefinitions,
  OpenAPIRegistry,
  RouteConfig,
} from '../../src/openapi-registry'
import {
  OpenApiGeneratorV3,
  OpenAPIObjectConfig,
} from '../../src/v3.0/openapi-generator'
import { OpenApiGeneratorV31 } from '../../src/v3.1/openapi-generator'
import { OpenApiVersion } from '../../src/openapi-generator'

export function createSchemas(
  zodSchemas: ZodType[],
  openApiVersion: OpenApiVersion = '3.0.0'
) {
  const definitions = zodSchemas.map(schema => ({
    type: 'schema' as const,
    schema,
  }))

  const OpenApiGenerator =
    openApiVersion === '3.1.0' ? OpenApiGeneratorV31 : OpenApiGeneratorV3

  const { components } = new OpenApiGenerator(definitions).generateComponents()

  return components
}

export function expectSchema<T extends OpenApiVersion = '3.0.0'>(
  zodSchemas: ZodType[],
  openAPISchemas: T extends '3.1.0' ? SchemasObjectV31 : SchemasObjectV30,
  openApiVersion?: T
) {
  const components = createSchemas(zodSchemas, openApiVersion)

  expect(components?.['schemas']).toEqual(openAPISchemas)
}

export function registerParameter<T extends ZodType>(
  refId: string,
  zodSchema: T
) {
  const registry = new OpenAPIRegistry()

  const schema = registry.registerParameter(refId, zodSchema)

  return { type: 'parameter', schema } as const
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
  }
}

export const testDocConfig: OpenAPIObjectConfig = {
  openapi: '3.0.0',
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
}

export function generateDataForRoute(
  props: Partial<RouteConfig> = {},
  additionalDefinitions: OpenAPIDefinitions[] = []
): OperationObject & {
  documentSchemas: ComponentsObject['schemas']
  documentParameters: ComponentsObject['parameters']
} {
  const route = createTestRoute(props)

  const routeDefinition = {
    type: 'route' as const,
    route,
  }

  const { paths, components } = new OpenApiGeneratorV3([
    ...additionalDefinitions,
    routeDefinition,
  ]).generateDocument(testDocConfig)

  const routeDoc = paths[route.path]?.[route.method] as OperationObject

  return {
    documentSchemas: components?.schemas,
    documentParameters: components?.parameters,
    ...routeDoc,
  }
}
