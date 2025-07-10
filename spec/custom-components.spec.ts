import { OpenAPIRegistry } from '../src/openapi-registry'
import { z } from 'zod'
import { extendZodWithOpenApi } from '../src/zod-extensions'
import { OpenApiGeneratorV3 } from '../src/v3.0/openapi-generator'
import { testDocConfig } from './lib/helpers'

extendZodWithOpenApi(z)

// TODO: Tests with both generators
describe('Custom components', () => {
  it('can register and generate security schemes', () => {
    const registry = new OpenAPIRegistry()

    const bearerAuth = registry.registerComponent(
      'securitySchemes',
      'bearerAuth',
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }
    )

    registry.registerPath({
      path: '/units',
      method: 'get',
      security: [{ [bearerAuth.name]: [] }],
      responses: {
        200: {
          description: 'Sample response',
          content: {
            'application/json': {
              schema: z.string(),
            },
          },
        },
      },
    })

    const builder = new OpenApiGeneratorV3(registry.definitions)
    const document = builder.generateDocument(testDocConfig)

    expect(document.paths['/units']?.get?.security).toEqual([
      { bearerAuth: [] },
    ])

    expect(document.components!.securitySchemes).toEqual({
      bearerAuth: {
        bearerFormat: 'JWT',
        scheme: 'bearer',
        type: 'http',
      },
    })
  })

  it('can register and generate headers', () => {
    const registry = new OpenAPIRegistry()

    const apiKeyHeader = registry.registerComponent('headers', 'api-key', {
      example: '1234',
      required: true,
      description: 'The API Key you were given in the developer portal',
    })

    registry.registerPath({
      path: '/units',
      method: 'get',
      responses: {
        200: {
          description: 'Sample response',
          headers: { 'x-api-key': apiKeyHeader.ref },
          content: {
            'application/json': {
              schema: z.string(),
            },
          },
        },
      },
    })

    const builder = new OpenApiGeneratorV3(registry.definitions)
    const document = builder.generateDocument(testDocConfig)

    expect(document.paths['/units']?.get?.responses['200'].headers).toEqual({
      'x-api-key': { $ref: '#/components/headers/api-key' },
    })

    expect(document.components!.headers).toEqual({
      'api-key': {
        example: '1234',
        required: true,
        description: 'The API Key you were given in the developer portal',
      },
    })
  })

  it('can generate responses', () => {
    const registry = new OpenAPIRegistry()

    const response = registry.registerComponent('responses', 'BadRequest', {
      description: 'BadRequest',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        },
      },
    })

    registry.registerPath({
      summary: 'Get user of an organization',
      method: 'get',
      path: '/test',
      responses: {
        '400': response.ref,
      },
    })

    const builder = new OpenApiGeneratorV3(registry.definitions)
    const document = builder.generateDocument(testDocConfig)

    expect(document.paths['/test']?.get?.responses['400']).toEqual({
      $ref: '#/components/responses/BadRequest',
    })

    expect(document.components!.responses).toEqual({
      BadRequest: {
        description: 'BadRequest',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { name: { type: 'string' } },
            },
          },
        },
      },
    })
  })
})
