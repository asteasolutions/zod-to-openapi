import { z } from 'zod';
import { extendZodWithOpenApi } from './zod-extensions';
import { OpenApiGeneratorV3 } from './v3.0/openapi-generator';
import { OpenAPIRegistry } from './openapi-registry';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const schema = registry.register(
  'schema',
  z.object({
    id: z.number(),
  })
);

registry.registerPath({
  method: 'get',
  path: '...',
  summary: '...',
  description: '...',
  request: {
    query: schema,
  },
  responses: {
    200: {
      description: '...',
      content: {
        'application/json': {
          schema: z.object({}),
        },
      },
    },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);

// const docs = generator.generateDocument({
//   openapi: '3.0.0',
//   info: {
//     version: '1.0.0',
//     title: 'My API',
//     description: 'This is the API',
//   },
//   servers: [{ url: 'v1' }],
// });

const components = generator.generateComponents();

console.log(JSON.stringify(components, null, 4));
