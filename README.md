# Zod to OpenAPI

A library that uses [zod schemas](https://github.com/colinhacks/zod) to generate an Open API Swagger documentation.

1. [Purpose and quick example](#purpose-and-quick-example)
2. [Usage](#usage)
   1. [Installation](#installation)
   2. [The `openapi` method](#the-openapi-method)
   3. [The Registry](#the-registry)
   4. [Defining schemas](#defining-schemas)
   6. [Defining routes](#defining-routes)
   7. [A full example](#a-full-example)
   8. [Adding it as part of your build](#adding-it-as-part-of-your-build)
3. [Technologies](#technologies)

We keep a changelog as part of the [GitHub releases](https://github.com/asteasolutions/zod-to-openapi/releases).

## Purpose and quick example

We at [Astea Solutions](https://asteasolutions.com/) made this library because we use [zod](https://github.com/colinhacks/zod) for validation in our APIs and are tired of the duplication to also support a separate OpenAPI definition that must be kept in sync. Using `zod-to-openapi`, we generate OpenAPI definitions directly from our zod schemas, this having single source of truth.

Simply put, it turns this:

```ts
const UserSchema = registry.register(
  'User',
  z.object({
    id: z.string().openapi({ example: '1212121' }),
    name: z.string().openapi({ example: 'John Doe' }),
    age: z.number().openapi({ example: 42 }),
  })
);

registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  summary: 'Get a single user',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      mediaType: 'application/json',
      schema: UserSchema.openapi({
        description: 'Object with user data',
      }),
    }
  },
});
```

into this:

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
          example: John Doe
        age:
          type: number
          example: 42
      required:
        - id
        - name
        - age

/users/{id}:
  get:
    summary: Get a single user
    parameters:
      - in: path
        name: id
        schema:
          type: string
        required: true
    responses:
      '200':
        description: Object with user data
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
```

and you can still use `UserSchema` and the `request.params` object to validate the input of your API.

## Usage

### Installation

```shell
npm install @asteasolutions/zod-to-openapi
# or
yarn add @asteasolutions/zod-to-openapi
```

### The `openapi` method

To keep openapi definitions natural, we add an `openapi` method to all Zod objects. For this to work, you need to call `extendZodWithOpenApi` once in your project.

Note: This should be done only once in a common-entrypoint file of your project (for example an `index.ts`/`app.ts`). If you're using tree-shaking with Webpack, mark that file as having side-effects.

```ts
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// We can now use `.openapi()` to specify OpenAPI metadata
z.string().openapi({ description: 'Some string' });
```

### The Registry

The `OpenAPIRegistry` is used to track definitions which are later generated using the `OpenAPIGenerator` class.

```ts
import {
  OpenAPIRegistry,
  OpenAPIGenerator,
} from '@asteasolutions/zod-to-openapi';

const registry = new OpenAPIRegistry();

// Register definitions here

const generator = new OpenAPIGenerator(registry.definitions);

return generator.generateComponents();
```

`generateComponents` will generate only the `/components` section of an OpenAPI document (e.g. only `schemas` and `parameters`), not generating actual routes.

### Defining schemas

An OpenAPI schema should be registered using the `register` method of an `OpenAPIRegistry` instance.

```ts
const UserSchema = registry.register(
  'User',
  z.object({
    id: z.string().openapi({ example: '1212121' }),
    name: z.string().openapi({ example: 'John Doe' }),
    age: z.number().openapi({ example: 42 }),
  })
);
```

If run now, `generateComponents` will generate the following structure:

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
          example: John Doe
        age:
          type: number
          example: 42
      required:
        - id
        - name
        - age
```

The key for the schema in the output is the first argument passed to `.register` (in this case - `User`).

Note that `generateComponents` does not return YAML but a JS object - you can then serialize that object into YAML or JSON depending on your use-case.

The resulting schema can then be referenced by using `$ref: #/components/schemas/User` in an existing OpenAPI JSON. This will be done automatically for Routes defined through the registry.

### Defining routes

#### Registering a path

An OpenAPI path is registered using the `registerPath` method of an `OpenAPIRegistry` instance.

```ts
registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  description: 'Get user data by its id',
  summary: 'Get a single user',
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1212121' })
    }),
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


#### Defining route parameters

If you don't want to inline all parameter definitions, you can define them separately with `registerParameter` and then reference them:

```ts
const UserIdParam = registry.registerParameter(
  'UserId',
  z.string().openapi({
    param: {
      name: 'id',
      in: 'path',
    },
    example: '1212121',
  })
);

registry.registerPath({
  ...
  request: {
    params: z.object({
      id: UserIdParam
    }),
  },
  responses: ...
});
```
The YAML equivalent would be:

```yaml
components:
  parameters:
    UserId:
      in: path
      name: id
      schema:
        type: string
        example: '1212121'
      required: true

'/users/{id}':
  get:
    ...
    parameters:
      - $ref: '#/components/parameters/UserId'
    responses: ...
```

Note: In order to define properties that apply to the parameter itself, use the `param` property of `.openapi`. Any properties provided outside of `param` would be applied to the schema for this parameter.

#### Generating the full document

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

Then you can create a script that executes the exported `generateOpenAPI` function. This script can be executed as a part of your build step so that it can write the result to some file like `openapi-docs.json`.

## Technologies

- [Typescript](https://www.typescriptlang.org/)
- [Zod 3.x](https://github.com/colinhacks/zod)
- [OpenAPI 3.x TS](https://github.com/metadevpro/openapi3-ts)
