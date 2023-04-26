import {
  OpenAPIGenerator,
  OpenAPIObjectConfig,
} from '../src/openapi-generator';
import { OpenAPIRegistry } from '../src/openapi-registry';
import { z } from 'zod';
import { extendZodWithOpenApi } from '../src/zod-extensions';

extendZodWithOpenApi(z);

const testDocConfig: OpenAPIObjectConfig = {
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

describe('Custom components', () => {
  it('can register and generate security schemes', () => {
    const registry = new OpenAPIRegistry();

    const bearerAuth = registry.registerComponent(
      'securitySchemes',
      'bearerAuth',
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }
    );

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
    });

    const builder = new OpenAPIGenerator(registry.definitions, '3.0.0');
    const document = builder.generateDocument(testDocConfig) as any;

    expect(document.paths['/units'].get.security).toEqual([{ bearerAuth: [] }]);

    expect(document.components!.securitySchemes).toEqual({
      bearerAuth: {
        bearerFormat: 'JWT',
        scheme: 'bearer',
        type: 'http',
      },
    });
  });

  it('can register and generate headers', () => {
    const registry = new OpenAPIRegistry();

    const apiKeyHeader = registry.registerComponent('headers', 'api-key', {
      example: '1234',
      required: true,
      description: 'The API Key you were given in the developer portal',
    });

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
    });

    const builder = new OpenAPIGenerator(registry.definitions, '3.0.0');
    const document = builder.generateDocument(testDocConfig) as any;

    expect(document.paths['/units'].get.responses['200'].headers).toEqual({
      'x-api-key': { $ref: '#/components/headers/api-key' },
    });

    expect(document.components!.headers).toEqual({
      'api-key': {
        example: '1234',
        required: true,
        description: 'The API Key you were given in the developer portal',
      },
    });
  });
});
