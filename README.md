# Zod to OpenAPI

A library that uses zod schemas to generate an Open API Swagger documentation.

1. [Purpose](#purpose)
2. [How it works](#how-it-works)
   1. [Technologies](#technologies)
   2. [Concept](#concept)
3. [Quick start](#quick-start) — Fast Track
   1. [Installation](#installation)
   2. [Set up](#set-up)

<!-- TODO: Something about a CHANGELOG -->

## Purpose

We at Astea Solutions made this library because of the duplication of work when creating an API validated API with `zod` that needs documentation.

For example:

We can have a zod schema like

```ts
const UserIdSchema = z.object({
  id: z.string(),
});
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
});
```

this schema can be used to validate the response of a `GET /users/{id}` endpoint. So the documentation may look like

```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          example: '1212121'
        name:
          type: string
          example: 'John Doe'
        age:
          type: number
          example: 42
      required:
        - userId
        - name
        - age
  parameters:
    UserId:
      in: header
      name: id
      schema:
        type: string
      required: true
      description: The user id to look for
      allowReserved: true
      example: '1212121'
# ... Some other stuff in between
paths:
  /users/{id}:
    get:
      description: Get user data by its id
      summary: Get a single user
      parameters:
        - $ref: '#/components/parameters/UserId'
      responses:
        '200':
          description: Object with user data.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
```

Obviously there is a lot of duplication when defining the zod schema and the schema for Open API. And let's face it - writing code with intellisense is much easier than writing YAML.

### The solution

With z

```ts
extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();

const UserIdSchema = registry.registerParameter(
  'UserId',
  z.object({
    id: z.string().openapi({
      example: '1212121',
    }),
  })
);
const UserSchema = registry.register(
  'User',
  z.object({
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
);

registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  description: 'Get user data by its id',
  summary: 'Get a single user',
  request: {
    params: UserIdSchema,
  },
  responses: {
    200: {
      mediaType: 'application/json',
      schema: UserSchema.openapi({
        description: 'Object with user data.',
      }),
    },
  },
});

const generator = new OpenAPIGenerator(rootRegistry.definitions);
generator.generateDocument({ ...somBaseOpenApiConfig }); // this would return an object in the OpenAPI format
// If needed to you can always use yaml.stringify()
```

## How it works

### Technologies

- [Typescript](https://www.typescriptlang.org/) first.
- Schema validation — [Zod 3.x](https://github.com/colinhacks/zod).
- Documenting — [OpenAPI 3.x](https://github.com/metadevpro/openapi3-ts).

### Concept

The library exposes three main things:

- `extendZodWithOpenApi` - a method that adds a custom `.openapi()` method to any zod schema
- `OpenAPIRegistry` a utility class used to create definitions for `OpenAPIGenerator`
- `OpenAPIGenerator` - the main class that produces an Open API documentation based on the provided definitions

## Quick start

### Installation

```shell
yarn add zod-to-openapi
# or
npm install zod-to-openapi
```

### Set up

In a main file somewhere in your file system:

```ts
import { z } from 'zod';
import {
  extendZodWithOpenApi,
  OpenAPIGenerator,
  OpenAPIRegistry,
} from 'zod-t-openapi';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export function generateOpenAPI() {
  const config = {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'My API',
      description: 'This is the API',
    },
    servers: [{ url: 'v1' }],
  };

  return new OpenAPIGenerator(schemas.definitions).generateDocument();
}
```

Then you can execute the exported `generateOpenAPI` function in a script in your build step and write the
result to some file like `swagger.json` to serve it as documentation when needed.
