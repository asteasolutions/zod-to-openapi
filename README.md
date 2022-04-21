# Zod to OpenAPI

A library that uses zod schemas to generate an Open API Swagger documentation.

1. [Purpose](#purpose)
2. [Usage](#usage)
   1. [Installation](#installation)
   2. [Expanding the zod functionalities](#expanding-the-zod-functionalities)
   3. [Generating components](#generating-components)
   4. [Registering schema definitions](#registering-schema-definitions)
   5. [Registering parameter definitions](#registering-parameter-definitions)
   6. [Generating a full OpenAPI document](#generating-a-full-openapi-document)
   7. [A full example](#a-full-example)
   8. [Adding it as part of your build](#adding-it-as-part-of-your-build)
3. [Technologies](#technologies)

<!-- TODO: Something about a CHANGELOG -->

## Purpose

We at [Astea Solutions](https://asteasolutions.com/) made this library because of the duplication of work when creating a documentation for an API that uses `zod` to validate request input and output.

## Usage

### Installation

```shell
yarn add @asteasolutions/zod-to-openapi
# or
npm install @asteasolutions/zod-to-openapi
```

### Expanding the zod functionalities

In order to specify some OpenAPI specific metadata you should use the exported `extendZodWithOpenApi`
function with your own instance of `zod`.

Note: This should be done only once in a common-entrypoint file of your project (for example an `index.ts`/`app.ts`)

```ts
import { extendZodWithOpenApi } from '@asteasolutions/@asteasolution/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// We can now use `.openapi()` to specify OpenAPI metadata
z.string().openapi({ description: 'Some string' });
```

### Generating components

The `OpenAPIRegistry` class is used as a utility for creating definitions that are then to be used to
generate the OpenAPI document using the `OpenAPIGenerator` class. In order to generate components the `generateComponents` method should be used.

```ts
import {
  OpenAPIRegistry,
  OpenAPIGenerator,
} from '@asteasolutions/@asteasolution/zod-to-openapi';

const registry = new OpenAPIRegistry();

// Register definitions here

const generator = new OpenAPIGenerator(registry.definitions);

return generator.generateComponents();
```

### Registering schema definitions

An OpenAPI schema should be registered using the `register` method of an `OpenAPIRegistry` instance.

```ts
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
```

The YAML equivalent of the schema above would be:

```yaml
User:
  type: object
  properties:
    id:
      type: string
      example: '1212121'
    name:
      type: string
      example: John Doe
    age:
      type: number
      example: 42
  required:
    - id
    - name
    - age
```

Note: All properties defined inside `.openapi` of a single zod schema are applied at their appropriate schema level.

The result would be an object like `{ components: { schemas: { User: {...} } } }`. The key for the object is the value of the first argument passed to `.register` (in this case - `User`).

The resulting schema can then be referenced by using `$ref: #/components/schemas/User` in an existing OpenAPI JSON.

### Registering parameter definitions

An OpenAPI parameter (query/path/header) should be registered using the `registerParameter` method of an `OpenAPIRegistry` instance.

```ts
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
```

Note: Parameter properties are more specific to those of an OpenAPI schema. In order to define properties that apply to the parameter itself, use the `param` property of `.openapi`. Any properties provided outside of `param` would be applied to the schema for this parameter.

The YAML equivalent of the schema above would be:

```yaml
UserId:
  in: path
  name: id
  schema:
    type: string
    example: '1212121'
  required: true
```

The result would be an object like `{ components: { parameters: { UserId: {...} } } }`. The key for the object is the value of the first argument passed to `.registerParameter` (in this case - `UserId`).

The resulting schema can then be referenced by using `$ref: #/components/parameters/User` in an existing OpenAPI JSON.

### Generating a full OpenAPI document

A full OpenAPI document can be generated using the `generateDocument` method of an `OpenAPIGenerator` instance. It takes one argument - the document config. It may look something like this:

```ts
return generator.generateDocument({
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'My API',
    description: 'This is the API',
  },
  servers: [{ url: 'v1' }],
});
```

#### Registering a path

An OpenAPI path should be registered using the `registerPath` method of an `OpenAPIRegistry` instance.

```ts
registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  description: 'Get user data by its id',
  summary: 'Get a single user',
  request: {
    params: z.object({ id: UserIdSchema }),
  },
  responses: {
    200: {
      mediaType: 'application/json',
      schema: UserSchema.openapi({
        description: 'Object with user data.',
      }),
    },
    204: z.void(),
  },
});
```

The YAML equivalent of the schema above would be:

```yaml
'/users/{id}':
  get:
    description: Get user data by its id
    summary: Get a single user
    parameters:
      - in: path
        name: id
        schema:
          type: string
          example: '1212121'
        required: true
    responses:
      '200':
        description: Object with user data.
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      '204':
        description: No content - successful operation
```

The library specific properties for `registerPath` are `method`, `path`, `request` and `responses`. Everything else gets directly appended to the path definition.

- `method` - One of `get`, `post`, `put`, `delete` and `patch`;
- `path` - a string - being the path of the endpoint;
- `request` - an optional object with optional `body`, `params`, `query` and `headers` keys,
  - `query`, `params` - being instances of `ZodObject`
  - `body` - being any `zod` instance
  - `headers` - an array of `zod` instances
- `responses` - an object where the key is the status code or `default` and the value is either:
  - an instance of `ZodVoid` - meaning a no content response
  - an object with `mediaType` (a string like `application/json`) and a `schema` of any zod type

### A full example

A full example code can be found [here](./example/index.ts). And the YAML representation of its result - [here](./example/openapi-docs.yml)

### Adding it as part of your build

In a file inside your project you can have a file like so:

```ts
export const registry = new OpenAPIRegistry();

export function generateOpenAPI() {
  const config = {...}; // your config comes here

  return new OpenAPIGenerator(schemas.definitions).generateDocument(config);
}
```

You then use the exported `registry` object to register all schemas, parameters and routes where appropriate.

Then you can create a script that can execute the exported `generateOpenAPI` function. This script can be executed as a part of your build step so that it can write the result to some file like `openapi-docs.json`.

## Technologies

- [Typescript](https://www.typescriptlang.org/)
- [Zod 3.x](https://github.com/colinhacks/zod)
- [OpenAPI 3.x](https://github.com/metadevpro/openapi3-ts)
