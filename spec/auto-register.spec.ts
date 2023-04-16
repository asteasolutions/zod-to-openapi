import { z } from 'zod';
import { expectSchema, generateDataForRoute } from './lib/helpers';

describe('Automatic registration', () => {
  it('can automatically register schemas', () => {
    const schema = z.string().refId('Test');

    expectSchema([schema], {
      Test: {
        type: 'string',
      },
    });
  });

  it('can automatically register nested schemas', () => {
    const schema = z.object({ key: z.string().refId('Test') }).refId('Object');

    expectSchema([schema], {
      Test: {
        type: 'string',
      },

      Object: {
        type: 'object',
        properties: {
          key: {
            $ref: '#/components/schemas/Test',
          },
        },
        required: ['key'],
      },
    });
  });

  it('can automatically register extended parent properties', () => {
    const schema = z.object({ id: z.number().refId('NumberId') });

    const extended = schema
      .extend({
        name: z.string().refId('Name'),
      })
      .refId('ExtendedObject');

    expectSchema([extended], {
      Name: {
        type: 'string',
      },

      NumberId: {
        type: 'number',
      },

      ExtendedObject: {
        type: 'object',
        properties: {
          id: {
            $ref: '#/components/schemas/NumberId',
          },
          name: {
            $ref: '#/components/schemas/Name',
          },
        },
        required: ['id', 'name'],
      },
    });
  });

  it('can automatically register extended schemas', () => {
    const schema = z
      .object({ id: z.string().refId('StringId') })
      .refId('Object');

    const extended = schema
      .extend({
        id: z.number().refId('NumberId'),
      })
      .refId('ExtendedObject');

    expectSchema([extended], {
      StringId: {
        type: 'string',
      },

      NumberId: {
        type: 'number',
      },

      Object: {
        type: 'object',
        properties: {
          id: {
            $ref: '#/components/schemas/StringId',
          },
        },
        required: ['id'],
      },

      ExtendedObject: {
        allOf: [
          { $ref: '#/components/schemas/Object' },
          {
            type: 'object',
            properties: {
              id: { $ref: '#/components/schemas/NumberId' },
            },
          },
        ],
      },
    });
  });

  it('can automatically register array items', () => {
    const schema = z.array(z.string().refId('StringId')).refId('Array');

    expectSchema([schema], {
      StringId: {
        type: 'string',
      },

      Array: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/StringId',
        },
      },
    });
  });

  it('can automatically register tuple items', () => {
    const schema = z
      .tuple([z.string().refId('StringId'), z.number().refId('NumberId')])
      .refId('Tuple');

    expectSchema([schema], {
      StringId: {
        type: 'string',
      },

      NumberId: {
        type: 'number',
      },

      Tuple: {
        type: 'array',

        items: {
          anyOf: [
            { $ref: '#/components/schemas/StringId' },
            { $ref: '#/components/schemas/NumberId' },
          ],
        },
        maxItems: 2,
        minItems: 2,
      },
    });
  });

  it('can automatically register union items', () => {
    const schema = z
      .union([z.string().refId('StringId'), z.number().refId('NumberId')])
      .refId('Union');

    expectSchema([schema], {
      StringId: {
        type: 'string',
      },

      NumberId: {
        type: 'number',
      },

      Union: {
        anyOf: [
          { $ref: '#/components/schemas/StringId' },
          { $ref: '#/components/schemas/NumberId' },
        ],
      },
    });
  });

  it('can automatically register discriminated union items', () => {
    const schema = z
      .discriminatedUnion('type', [
        z.object({ type: z.literal('dog').refId('DogType') }).refId('Dog'),
        z.object({ type: z.literal('cat').refId('CatType') }),
      ])
      .refId('DiscriminatedUnion');

    expectSchema([schema], {
      DogType: {
        type: 'string',
        enum: ['dog'],
      },

      CatType: {
        type: 'string',
        enum: ['cat'],
      },

      Dog: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { $ref: '#/components/schemas/DogType' },
        },
      },

      DiscriminatedUnion: {
        oneOf: [
          { $ref: '#/components/schemas/Dog' },
          {
            type: 'object',
            required: ['type'],
            properties: {
              type: { $ref: '#/components/schemas/CatType' },
            },
          },
        ],
      },
    });
  });

  it('can automatically register record items', () => {
    const schema = z.record(z.number().refId('NumberId')).refId('Record');

    expectSchema([schema], {
      NumberId: {
        type: 'number',
      },

      Record: {
        type: 'object',
        additionalProperties: {
          $ref: '#/components/schemas/NumberId',
        },
      },
    });
  });

  it('can automatically register intersection items', () => {
    const Person = z
      .object({
        name: z.string(),
      })
      .refId('Person');

    const Employee = z.object({
      role: z.string(),
    });

    const schema = z.intersection(Person, Employee).refId('Intersection');

    expectSchema([schema], {
      Person: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
        required: ['name'],
      },

      Intersection: {
        allOf: [
          { $ref: '#/components/schemas/Person' },
          {
            type: 'object',
            properties: { role: { type: 'string' } },
            required: ['role'],
          },
        ],
      },
    });
  });

  describe.each`
    type          | registerFunction     | rootDocPath
    ${'Routes'}   | ${'registerPath'}    | ${'paths'}
    ${'Webhooks'} | ${'registerWebhook'} | ${'webhooks'}
  `(
    '$type',
    ({
      registerFunction,
      rootDocPath,
    }: {
      registerFunction: 'registerPath' | 'registerWebhook';
      rootDocPath: 'paths' | 'webhooks';
    }) => {
      it('can automatically register request body data', () => {
        const Person = z
          .object({
            name: z.string(),
          })
          .refId('Person');

        const { documentSchemas, requestBody } = generateDataForRoute({
          request: {
            body: { content: { 'application/json': { schema: Person } } },
          },
        });

        expect(documentSchemas).toEqual({
          Person: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        });

        expect(requestBody).toEqual({
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Person' },
            },
          },
        });
      });

      it('can automatically register response body data', () => {
        const Person = z
          .object({
            name: z.string(),
          })
          .refId('Person');

        const { documentSchemas, responses } = generateDataForRoute({
          responses: {
            '200': {
              description: 'Test response',
              content: {
                'application/json': {
                  schema: Person,
                },
              },
            },
          },
        });

        expect(documentSchemas).toEqual({
          Person: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        });

        const response = responses['200'].content['application/json'];

        expect(response).toEqual({
          schema: {
            $ref: '#/components/schemas/Person',
          },
        });
      });

      it('can automatically register request query parameters', () => {
        const Person = z.object({ name: z.string() }).refId('Person');

        const { documentSchemas, parameters } = generateDataForRoute({
          request: {
            query: z.object({
              person: Person,
            }),
          },
        });

        expect(documentSchemas).toEqual({
          Person: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        });

        expect(parameters).toEqual([
          {
            in: 'query',
            name: 'person',
            required: true,
            schema: {
              $ref: '#/components/schemas/Person',
            },
          },
        ]);
      });

      it('can automatically register request path parameters', () => {
        const UserId = z.string().refId('UserId').length(6);

        const { documentSchemas, parameters } = generateDataForRoute({
          request: {
            params: z.object({
              id: UserId,
            }),
          },
        });

        expect(documentSchemas).toEqual({
          UserId: {
            type: 'string',
            minLength: 6,
            maxLength: 6,
          },
        });

        expect(parameters).toEqual([
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              $ref: '#/components/schemas/UserId',
            },
          },
        ]);
      });

      it('can automatically register headers', () => {
        const SessionToken = z.string().refId('SessionToken').length(6);

        const { documentSchemas, parameters } = generateDataForRoute({
          request: {
            headers: z.object({
              'x-session': SessionToken,
            }),
          },
        });

        expect(documentSchemas).toEqual({
          SessionToken: {
            type: 'string',
            minLength: 6,
            maxLength: 6,
          },
        });

        expect(parameters).toEqual([
          {
            in: 'header',
            name: 'x-session',
            required: true,
            schema: {
              $ref: '#/components/schemas/SessionToken',
            },
          },
        ]);
      });

      // TODO: Route parameters should be registered under `parameters` and not `schemas`
      // TODO: What happens if a schemas is being used once as a parameter and once as a schema. In that sense I think it
      // might be more reasonable to always default to "schemas". However when we check for data (references) we might need to check
      // both reference arrays.
      // Additional note: It is okay for a parameter schema to reference a components/schemas/{Name} => we can just put everything there and
      // registry.registerParameter would then be just an alias that makes the parameters. And that sound okay

      // TODO: Check the only leftover usage of `generateInnerSchema` for ZodEffects

      // TODO: Refactor the code by merging the branch with the removal of generateInnerSchema for generateSimpleSchema - rename stuff

      // TODO: Revisit the `.refId` implementation. A new `.openapi` overload can be utilized instead

      // TODO: Update `README.md` and possibly new `.md` files with explanations can be provided
    }
  );
});
