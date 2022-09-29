import { z, ZodSchema } from 'zod';
import { OperationObject, PathItemObject } from 'openapi3-ts';
import { OpenAPIGenerator } from '../src/openapi-generator';
import { extendZodWithOpenApi } from '../src/zod-extensions';
import { OpenAPIRegistry, RouteConfig } from '../src/openapi-registry';

function createTestRoute(props: Partial<RouteConfig> = {}): RouteConfig {
  return {
    method: 'get',
    path: '/',
    responses: {
      200: {
        description: 'Response',
        content: {
          'application/json': {
            schema: z.object({}),
          },
        },
      },
    },
    ...props,
  };
}

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

// TODO: setupTests.ts
extendZodWithOpenApi(z);

describe('Routes', () => {
  describe('response definitions', () => {
    it('can set description through the response definition or through the schema', () => {
      const registry = new OpenAPIRegistry();

      registry.registerPath({
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
        registry.definitions
      ).generateDocument(testDocConfig);
      const responses = document.paths['/'].get.responses;

      expect(responses['200'].description).toEqual('Simple response');
      expect(responses['404'].description).toEqual('Missing object');
    });

    it('can set multiple response formats', () => {
      const registry = new OpenAPIRegistry();

      const UserSchema = registry.register(
        'User',
        z.object({ name: z.string() })
      );

      registry.registerPath({
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
        registry.definitions
      ).generateDocument(testDocConfig);
      const responses = document.paths['/'].get.responses;

      expect(responses['200'].description).toEqual('Simple response');
      expect(responses['200'].content['application/json'].schema).toEqual({
        $ref: '#/components/schemas/User',
      });
      expect(responses['200'].content['application/xml'].schema).toEqual({
        $ref: '#/components/schemas/User',
      });
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

    it('generates a header parameter for route', () => {
      const routeParameters = generateParamsForRoute({
        request: { headers: [z.string().openapi({ param: { name: 'test' } })] },
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
      const TestHeader = z.string().openapi({
        refId: 'TestHeader',
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
      const TestQuery = z.string().openapi({
        refId: 'TestQuery',
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
        const TestHeader = z.string().openapi({
          refId: 'TestHeader',
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
        const TestQuery = z.string().openapi({
          refId: 'TestQuery',
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
        const TestQuery = z
          .string()
          .openapi({ refId: 'TestQuery', param: { name: 'test' } });

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

      const { paths } = new OpenAPIGenerator([
        ...paramDefinitions,
        routeDefinition,
      ]).generateDocument(testDocConfig);

      const routes = paths[route.path] as PathItemObject;

      const routeDoc = routes[route.method];

      return routeDoc?.parameters;
    }
  });
});
