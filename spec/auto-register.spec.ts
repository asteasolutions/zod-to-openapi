import { z } from 'zod';
import { createTestRoute, expectSchema, testDocConfig } from './lib/helpers';
import { OpenAPIGenerator, OpenAPIRegistry } from '../src';

const ads: unknown = { a: 3 };

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

  it('can automatically register parent properties', () => {
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

        const route = createTestRoute({
          request: {
            body: { content: { 'application/json': { schema: Person } } },
          },
        });

        const registry = new OpenAPIRegistry();

        registry[registerFunction](route);

        const document = new OpenAPIGenerator(
          registry.definitions,
          '3.0.0'
        ).generateDocument(testDocConfig);

        expect(document.components?.schemas).toEqual({
          Person: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        });

        // TODO: Implicit - make an expectRoute helper
        const { requestBody } = document[rootDocPath]?.['/'].get;

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

        const registry = new OpenAPIRegistry();

        registry[registerFunction]({
          path: '/',
          method: 'post',
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

        const document = new OpenAPIGenerator(
          registry.definitions,
          '3.0.0'
        ).generateDocument(testDocConfig);

        expect(document.components?.schemas).toEqual({
          Person: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        });

        // TODO: Implicit - make an expectRoute helper
        const response =
          document[rootDocPath]?.['/'].post.responses['200'].content[
            'application/json'
          ];

        expect(response).toEqual({
          schema: {
            $ref: '#/components/schemas/Person',
          },
        });
      });

      // TODO: Add tests for parameters (query and params) and headers.

      // TODO: Check the only leftover usage of `generateInnerSchema` for ZodEffects

      // TODO: Refactor the code by merging the branch with the removal of generateInnerSchema for generateSimpleSchema - rename stuff

      // TODO: Improve tests above by extracting some common logic in a helper

      // TODO: Make sure that tests that use the two registration methods have proper names that can be used to distinguish them

      // TODO: Revisit the `.refId` implementation. A new `.openapi` overload can be utilized instead

      // TODO: Update `README.md` and possibly new `.md` files with explanations can be provided
    }
  );
});
