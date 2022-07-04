import { OpenAPIGenerator } from '../src/openapi-generator';
import { OpenAPIRegistry } from '../src/openapi-registry';
import { SecuritySchemeObject } from 'openapi3-ts';
import { z } from 'zod';
import {extendZodWithOpenApi} from "../src";

const testDocConfig = {
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
};

extendZodWithOpenApi(z);

describe('securitySchemas', () => {
  const registry = new OpenAPIRegistry();

  const bearerAuth = registry.registerSecurityScheme('bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  })

  const Unit = registry.register('UnitDto', z.object({
    id: z.string().uuid(),
    name: z.string(),
  })).openapi({description: 'unit'})

  registry.registerPath({
    path: '/units',
    method: 'get',
    security: [
      bearerAuth.security(),
    ],
    responses: {
      200: {
        mediaType: 'application/json',
        schema: Unit.array().openapi({description: 'Array of all units'})
      }
    }
  })

  const builder = new OpenAPIGenerator(registry.definitions)
  const doc = builder.generateDocument(testDocConfig);

  it('should have security in /units', () => {
    expect(doc.paths!['/units'].get.security).toStrictEqual([
      {
        bearerAuth: []
      }
    ]);
  })

  it('should have securitySchemes', () => {
    expect(doc.components!.securitySchemes).toStrictEqual({bearerAuth: {
      bearerFormat: "JWT",
      scheme: "bearer",
      type: "http",
    }});
  })
})
