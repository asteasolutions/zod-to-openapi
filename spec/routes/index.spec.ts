import { z, ZodSchema } from 'zod';
import { OperationObject, PathItemObject } from 'openapi3-ts/oas30';
import { OpenAPIGenerator } from '../../src/openapi-generator';
import { OpenAPIRegistry, RouteConfig } from '../../src/openapi-registry';
import { createTestRoute, registerSchema, testDocConfig } from '../lib/helpers';

const routeTests = ({
  registerFunction,
  rootDocPath,
}: {
  registerFunction: 'registerPath' | 'registerWebhook';
  rootDocPath: 'paths' | 'webhooks';
}) => {
  describe('response definitions', () => {
    it('can set description', () => {
      const registry = new OpenAPIRegistry();

      registry[registerFunction]({
        method: 'get',
        path: '/',
        responses: {
          200: {
            description: 'Simple response',
            content: {
              'application/json': {
                schema: z.string(),
              },
            },
          },

          404: {
            description: 'Missing object',
            content: {
              'application/json': {
                schema: z.string(),
              },
            },
          },
        },
      });

      const document = new OpenAPIGenerator(
        registry.definitions,
        '3.0.0'
      ).generateDocument(testDocConfig) as any;
      const responses = document[rootDocPath]?.['/'].get.responses;

      expect(responses['200'].description).toEqual('Simple response');
      expect(responses['404'].description).toEqual('Missing object');
    });

    it('can specify response with plain OpenApi format', () => {
      const registry = new OpenAPIRegistry();

      registry[registerFunction]({
        method: 'get',
        path: '/',
        responses: {
          200: {
            description: 'Simple response',
            content: {
              'application/json': {
                schema: {
                  type: 'string',
                  example: 'test',
                },
              },
            },
          },

          404: {
            description: 'Missing object',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SomeRef',
                },
              },
            },
          },
        },
      });

      const document = new OpenAPIGenerator(
        registry.definitions,
        '3.0.0'
      ).generateDocument(testDocConfig) as any;
      const responses = document[rootDocPath]?.['/'].get.responses;

      expect(responses['200'].content['application/json'].schema).toEqual({
        type: 'string',
        example: 'test',
      });
      expect(responses['404'].content['application/json'].schema).toEqual({
        $ref: '#/components/schemas/SomeRef',
      });
    });

    it('can set multiple response formats', () => {
      const registry = new OpenAPIRegistry();

      const UserSchema = registry.register(
        'User',
        z.object({ name: z.string() })
      );

      registry[registerFunction]({
        method: 'get',
        path: '/',
        responses: {
          200: {
            description: 'Simple response',
            content: {
              'application/json': {
                schema: UserSchema,
              },
              'application/xml': {
                schema: UserSchema,
              },
            },
          },
        },
      });

      const document = new OpenAPIGenerator(
        registry.definitions,
        '3.0.0'
      ).generateDocument(testDocConfig) as any;
      const responses = document[rootDocPath]?.['/'].get.responses;

      expect(responses['200'].description).toEqual('Simple response');
      expect(responses['200'].content['application/json'].schema).toEqual({
        $ref: '#/components/schemas/User',
      });
      expect(responses['200'].content['application/xml'].schema).toEqual({
        $ref: '#/components/schemas/User',
      });
    });

    it('can generate responses without content', () => {
      const registry = new OpenAPIRegistry();

      registry[registerFunction]({
        method: 'get',
        path: '/',
        responses: {
          204: {
            description: 'Success',
          },
        },
      });

      const document = new OpenAPIGenerator(
        registry.definitions,
        '3.0.0'
      ).generateDocument(testDocConfig) as any;
      const responses = document[rootDocPath]?.['/'].get.responses;

      expect(responses['204']).toEqual({ description: 'Success' });
    });
  });

  it('can generate paths with multiple examples', () => {
    const registry = new OpenAPIRegistry();

    registry[registerFunction]({
      method: 'get',
      path: '/',
      responses: {
        400: {
          description: 'Failure',
          content: {
            'application/json': {
              schema: z.string(),
              examples: {
                example0: {
                  value: 'Oh no',
                },
                example1: {
                  value: 'Totally gone wrong',
                },
              },
            },
          },
        },
      },
    });

    const document = new OpenAPIGenerator(
      registry.definitions,
      '3.0.0'
    ).generateDocument(testDocConfig) as any;
    const responses = document[rootDocPath]?.['/'].get.responses;

    expect(responses['400']).toEqual(
      expect.objectContaining({ description: 'Failure' })
    );

    const examples = responses['400']?.content['application/json']?.examples;

    expect(examples).toEqual({
      example0: {
        value: 'Oh no',
      },
      example1: {
        value: 'Totally gone wrong',
      },
    });
  });

  describe('request body', () => {
    it('can specify request body metadata - description/required', () => {
      const registry = new OpenAPIRegistry();

      const route = createTestRoute({
        request: {
          body: {
            description: 'Test description',
            required: true,
            content: {
              'application/json': {
                schema: z.string(),
              },
            },
          },
        },
      });

      registry[registerFunction](route);

      const document = new OpenAPIGenerator(
        registry.definitions,
        '3.0.0'
      ).generateDocument(testDocConfig) as any;

      const { requestBody } = document[rootDocPath]?.['/'].get;

      expect(requestBody).toEqual({
        description: 'Test description',
        required: true,
        content: { 'application/json': { schema: { type: 'string' } } },
      });
    });

    it('can specify request body using plain OpenApi format', () => {
      const registry = new OpenAPIRegistry();

      const route = createTestRoute({
        request: {
          body: {
            content: {
              'application/json': {
                schema: {
                  type: 'string',
                  enum: ['test'],
                },
              },
              'application/xml': {
                schema: { $ref: '#/components/schemas/SomeRef' },
              },
            },
          },
        },
      });

      registry[registerFunction](route);

      const document = new OpenAPIGenerator(
        registry.definitions,
        '3.0.0'
      ).generateDocument(testDocConfig) as any;

      const requestBody = document[rootDocPath]?.['/'].get.requestBody.content;

      expect(requestBody['application/json']).toEqual({
        schema: { type: 'string', enum: ['test'] },
      });

      expect(requestBody['application/xml']).toEqual({
        schema: { $ref: '#/components/schemas/SomeRef' },
      });
    });

    it('can have multiple media format bodies', () => {
      const registry = new OpenAPIRegistry();

      const UserSchema = registry.register(
        'User',
        z.object({ name: z.string() })
      );

      const route = createTestRoute({
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.string(),
              },
              'application/xml': {
                schema: UserSchema,
              },
            },
          },
        },
      });

      registry[registerFunction](route);

      const document = new OpenAPIGenerator(
        registry.definitions,
        '3.0.0'
      ).generateDocument(testDocConfig) as any;

      const requestBody = document[rootDocPath]?.['/'].get.requestBody.content;

      expect(requestBody['application/json']).toEqual({
        schema: { type: 'string' },
      });

      expect(requestBody['application/xml']).toEqual({
        schema: { $ref: '#/components/schemas/User' },
      });
    });
  });
};

describe.each`
  type          | registerFunction     | rootDocPath
  ${'Routes'}   | ${'registerPath'}    | ${'paths'}
  ${'Webhooks'} | ${'registerWebhook'} | ${'webhooks'}
`('$type', routeTests);
