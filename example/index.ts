import {
  OpenApiGeneratorV3,
  // The exact same can be achieved by importing OpenApiGeneratorV31 instead:
  // OpenApiGeneratorV31
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from '../src';
import { z } from 'zod/v4';
import * as yaml from 'yaml';
import * as fs from 'fs';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const UserIdSchema = registry.registerParameter(
  'UserId',
  z.string().openapi({
    param: {
      name: 'id',
      in: 'path',
    },
    example: '1212121',
  })
);
const UserSchema = z
  .object({
    id: z.string().openapi({
      example: '1212121',
    }),
    name: z.string().openapi({
      example: 'John Doe',
    }),
    age: z.number().openapi({
      example: 42,
    }),
  })
  .openapi('User');

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  description: 'Get user data by its id',
  summary: 'Get a single user',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: UserIdSchema }),
  },
  responses: {
    200: {
      description: 'Object with user data.',
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
    },
    204: {
      description: 'No content - successful operation',
    },
  },
});

function getOpenApiDocumentation() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'My API',
      description: 'This is the API',
    },
    servers: [{ url: 'v1' }],
  });
}

function writeDocumentation() {
  // OpenAPI JSON
  const docs = getOpenApiDocumentation();

  // YAML equivalent
  const fileContent = yaml.stringify(docs);

  fs.writeFileSync(`${__dirname}/openapi-docs.yml`, fileContent, {
    encoding: 'utf-8',
  });
}

writeDocumentation();
