# Zod to OpenAPI

[![npm version](https://img.shields.io/npm/v/@asteasolutions/zod-to-openapi)](https://www.npmjs.com/package/@asteasolutions/zod-to-openapi)
[![npm downloads](https://img.shields.io/npm/dm/@asteasolutions/zod-to-openapi)](https://www.npmjs.com/package/@asteasolutions/zod-to-openapi)

A library that uses [zod schemas](https://github.com/colinhacks/zod) to generate an Open API Swagger documentation.

1. [Purpose and quick example](#purpose-and-quick-example)
2. [Usage](#usage)
   1. [Installation](#installation)
   2. [The `openapi` method](#the-openapi-method)
   3. [The Registry](#the-registry)
   4. [The Generator](#the-generator)
   5. [Defining schemas](#defining-schemas)
   6. [Defining routes & webhooks](#defining-routes--webhooks)
   7. [Defining custom components](#defining-custom-components)
   8. [A full example](#a-full-example)
   9. [Adding it as part of your build](#adding-it-as-part-of-your-build)
3. [Zod schema types](#zod-schema-types)
   1. [Supported types](#supported-types)
   2. [Unsupported types](#unsupported-types)
4. [Technologies](#technologies)

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
      description: 'Object with user data.',
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
    },
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

const generator = new OpenAPIGenerator(registry.definitions, '3.0.0');

return generator.generateComponents();
```

### The Generator

The generator constructor takes 2 arguments. An array of definitions from the registry and an Open API version.

The Open API version affects how some components are generated. For example: changing the version to `3.1.0` from `3.0.0` will result in following differences:

```ts
z.string().nullable().openapi(refId: 'name');
```

```yml
# 3.1.0
# nullable is invalid in 3.1.0 but type arrays are invalid in previous versions
name:
  type:
    - 'string'
    - 'null'

# 3.0.0
name:
  type: 'string'
  nullable: true
```

`generateComponents` will generate only the `/components` section of an OpenAPI document (e.g. only `schemas` and `parameters`), not generating actual routes.

`generateDocument` will generate the whole OpenAPI document.

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

### Defining routes & webhooks

#### Registering a path or webhook

An OpenAPI path is registered using the `registerPath` method of an `OpenAPIRegistry` instance. An OpenAPI webhook is registered using the `registerWebhook` method and takes the same parameters as `registerPath`.

```ts
registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  description: 'Get user data by its id',
  summary: 'Get a single user',
  request: {
    params: z.object({
      id: z.string().openapi({ example: '1212121' }),
    }),
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
  - `body` - an object with a `description` and a `content` record where:
    - the key is a `mediaType` string like `application/json`
    - and the value is an object with a `schema` of any `zod` type
  - `headers` - an array of `zod` instances
- `responses` - an object where the key is the status code or `default` and the value is an object with a `description` and a `content` record where:
  - the key is a `mediaType` string like `application/json`
  - and the value is an object with a `schema` of any `zod` type

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
  info: {
    version: '1.0.0',
    title: 'My API',
    description: 'This is the API',
  },
  servers: [{ url: 'v1' }],
});
```

### Defining custom components

You can define components that are not OpenAPI schemas, including security schemes, response headers and others. See [this test file](spec/custom-components.spec.ts) for examples.

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

## Zod schema types

### Supported types

The list of all supported types as of now is:

- `ZodString`
  - adding `format` for `.datetime()`, `.uuid()`, `.email()` and `.url()` and `pattern` for `.regex()` is also supported
- `ZodNumber`
  - including `z.number().int()` being inferred as `type: 'integer'`
- `ZodBoolean`
- `ZodDefault`
- `ZodNullable`
- `ZodOptional`
- `ZodEffects` - only for `.refine()`, `.preprocess()`
- `ZodLiteral`
- `ZodEnum`
- `ZodNativeEnum`
- `ZodObject`
- `ZodArray`
- `ZodDiscriminatedUnion`
  - including `discriminator` mapping when all Zod objects in the union are registered with `.register()` or contain a `refId`.
- `ZodUnion`
- `ZodIntersection`
- `ZodRecord`
- `ZodUnknown`
- `ZodDate`

Extending an instance of `ZodObject` is also supported and results in an OpenApi definition with `allOf`

### Unsupported types

In case you try to create an OpenAPI schema from a zod schema that is not one of the aforementioned types then you'd receive an `UnknownZodTypeError`.

You can still register such schemas on your own by providing a `type` via the `.openapi` method. In case you think that the desired behavior can be achieved automatically do not hesitate to reach out to us by describing your case via Github Issues.

**Note:** The `ZodEffects` schema from the `.transform` method is an example for a zod schema that cannot be automatically generated since the result of the transformation resides only as a type definition and is not an actual zod specific object.

## Technologies

- [Typescript](https://www.typescriptlang.org/)
- [Zod 3.x](https://github.com/colinhacks/zod)
- [OpenAPI 3.x TS](https://github.com/metadevpro/openapi3-ts)
