import { z, ZodSchema } from 'zod';
import { OperationObject, PathItemObject } from 'openapi3-ts';
import {
  OpenAPIGenerator,
  OpenAPIObjectConfig,
} from '../src/openapi-generator';
import { OpenAPIRegistry, RouteConfig } from '../src/openapi-registry';
import { registerSchema } from './lib/helpers';

function createTestRoute(props: Partial<RouteConfig> = {}): RouteConfig {
  return {
    method: 'get',
    path: '/',
    responses: {
      200: {
        description: 'OK Response',
      },
    },
    ...props,
  };
}

const testDocConfig: OpenAPIObjectConfig = {
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
      ).generateDocument(testDocConfig);
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
      ).generateDocument(testDocConfig);
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
      ).generateDocument(testDocConfig);
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
      ).generateDocument(testDocConfig);
      const responses = document[rootDocPath]?.['/'].get.responses;

      expect(responses['204']).toEqual({ description: 'Success' });
    });
  });

  describe('parameters', () => {
    it('generates a query parameter for route', () => {
      const routeParameters = generateParamsForRoute({
        request: { query: z.object({ test: z.string() }) },
      });

      expect(routeParameters).toEqual([
        {
          in: 'query',
          name: 'test',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ]);
    });

    it('generates a path parameter for route', () => {
      const routeParameters = generateParamsForRoute({
        request: { params: z.object({ test: z.string() }) },
      });

      expect(routeParameters).toEqual([
        {
          in: 'path',
          name: 'test',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ]);
    });

    it('generates a header parameter with array for route', () => {
      const routeParameters = generateParamsForRoute({
        request: {
          headers: z.object({ test: z.string() }),
        },
      });

      expect(routeParameters).toEqual([
        {
          in: 'header',
          name: 'test',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ]);
    });

    it('generates a header parameter with object for route', () => {
      const routeParameters = generateParamsForRoute({
        request: {
          headers: [z.string().openapi({ param: { name: 'test' } })],
        },
      });

      expect(routeParameters).toEqual([
        {
          in: 'header',
          name: 'test',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ]);
    });

    it('generates a reference header parameter for route', () => {
      const TestHeader = registerSchema('TestHeader', z.string()).openapi({
        param: { name: 'test', in: 'header' },
      });

      const routeParameters = generateParamsForRoute(
        {
          request: { headers: [TestHeader] },
        },
        [TestHeader]
      );

      expect(routeParameters).toEqual([
        {
          $ref: '#/components/parameters/TestHeader',
        },
      ]);
    });

    it('generates a reference query parameter for route', () => {
      const TestQuery = registerSchema('TestQuery', z.string()).openapi({
        param: { name: 'test', in: 'query' },
      });

      const routeParameters = generateParamsForRoute(
        {
          request: { query: z.object({ test: TestQuery }) },
        },
        [TestQuery]
      );

      expect(routeParameters).toEqual([
        {
          $ref: '#/components/parameters/TestQuery',
        },
      ]);
    });

    it('generates required based on inner schema', () => {
      const routeParameters = generateParamsForRoute({
        request: {
          query: z.object({ test: z.string().optional().default('test') }),
        },
      });

      expect(routeParameters).toEqual([
        {
          in: 'query',
          name: 'test',
          required: false,
          schema: {
            type: 'string',
            default: 'test',
          },
        },
      ]);
    });

    it('supports strict zod objects', () => {
      const routeParameters = generateParamsForRoute({
        request: {
          query: z.strictObject({
            test: z.string().optional().default('test'),
          }),
        },
      });

      expect(routeParameters).toEqual([
        {
          in: 'query',
          name: 'test',
          required: false,
          schema: {
            type: 'string',
            default: 'test',
          },
        },
      ]);
    });

    describe('errors', () => {
      it('throws an error in case of names mismatch', () => {
        expect(() =>
          generateParamsForRoute({
            request: {
              query: z.object({
                test: z.string().openapi({ param: { name: 'another' } }),
              }),
            },
          })
        ).toThrowError(/^Conflicting name/);
      });

      it('throws an error in case of location mismatch', () => {
        expect(() =>
          generateParamsForRoute({
            request: {
              query: z.object({
                test: z.string().openapi({ param: { in: 'header' } }),
              }),
            },
          })
        ).toThrowError(/^Conflicting location/);
      });

      it('throws an error in case of location mismatch with reference', () => {
        const TestHeader = registerSchema('TestHeader', z.string()).openapi({
          param: { name: 'test', in: 'header' },
        });

        expect(() =>
          generateParamsForRoute(
            {
              request: { query: z.object({ test: TestHeader }) },
            },
            [TestHeader]
          )
        ).toThrowError(/^Conflicting location/);
      });

      it('throws an error in case of name mismatch with reference', () => {
        const TestQuery = registerSchema('TestQuery', z.string()).openapi({
          param: { name: 'test', in: 'query' },
        });

        expect(() =>
          generateParamsForRoute(
            {
              request: { query: z.object({ randomName: TestQuery }) },
            },
            [TestQuery]
          )
        ).toThrowError(/^Conflicting name/);
      });

      it('throws an error in case of missing name', () => {
        expect(() =>
          generateParamsForRoute({
            request: { headers: [z.string()] },
          })
        ).toThrowError(/^Missing parameter data, please specify `name`/);
      });

      it('throws an error in case of missing location when registering a parameter', () => {
        const TestQuery = registerSchema('TestQuery', z.string()).openapi({
          param: { name: 'test' },
        });

        expect(() => generateParamsForRoute({}, [TestQuery])).toThrowError(
          /^Missing parameter data, please specify `in`/
        );
      });
    });

    function generateParamsForRoute(
      props: Partial<RouteConfig> = {},
      paramsToRegister?: ZodSchema<any>[]
    ): OperationObject['parameters'] {
      const route = createTestRoute(props);

      const paramDefinitions =
        paramsToRegister?.map(schema => ({
          type: 'parameter' as const,
          schema,
        })) ?? [];

      const routeDefinition = {
        type: 'route' as const,
        route,
      };

      const { paths } = new OpenAPIGenerator(
        [...paramDefinitions, routeDefinition],
        '3.0.0'
      ).generateDocument(testDocConfig);

      const routes = paths[route.path] as PathItemObject;

      const routeDoc = routes[route.method];

      return routeDoc?.parameters;
    }
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
      ).generateDocument(testDocConfig);

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
      ).generateDocument(testDocConfig);

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
      ).generateDocument(testDocConfig);

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
