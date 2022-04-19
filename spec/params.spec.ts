import { OpenAPIGenerator } from '../src/openapi-generator';
import { OperationObject, PathItemObject } from 'openapi3-ts';
import { z, ZodSchema } from 'zod';

import { extendZodWithOpenApi } from '../src/zod-extensions';
import { RouteConfig } from '../src/openapi-registry';

function createTestRoute(props: Partial<RouteConfig> = {}): RouteConfig {
  return {
    method: 'get',
    path: '/',
    response: z.object({}),
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
  describe('Parameters', () => {
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
            nullable: undefined,
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
            nullable: undefined,
            type: 'string',
          },
        },
      ]);
    });

    it('generates a header parameter for route', () => {
      const routeParameters = generateParamsForRoute({
        request: { headers: [z.string().openapi({ name: 'test' })] },
      });

      expect(routeParameters).toEqual([
        {
          in: 'header',
          name: 'test',
          required: true,
          schema: {
            nullable: undefined,
            type: 'string',
          },
        },
      ]);
    });

    it('generates a reference parameter for route', () => {
      const TestHeader = z
        .string()
        .openapi({ name: 'test', in: 'header', refId: 'TestHeader' });

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

    describe('errors', () => {
      it('throws an error in case of names mismatch', () => {
        expect(() =>
          generateParamsForRoute({
            request: {
              query: z.object({
                test: z.string().openapi({ name: 'another' }),
              }),
            },
          })
        ).toThrow();
      });

      it('throws an error in case of location mismatch', () => {
        expect(() =>
          generateParamsForRoute({
            request: {
              query: z.object({ test: z.string().openapi({ in: 'header' }) }),
            },
          })
        ).toThrow();
      });

      it('throws an error in case of location mismatch with reference', () => {
        const TestHeader = z
          .string()
          .openapi({ name: 'test', in: 'header', refId: 'TestHeader' });

        expect(() =>
          generateParamsForRoute(
            {
              request: { query: z.object({ test: TestHeader }) },
            },
            [TestHeader]
          )
        ).toThrow();
      });

      it('throws an error in case of name mismatch with reference', () => {
        const TestQuery = z
          .string()
          .openapi({ name: 'test', in: 'query', refId: 'TestQuery' });

        expect(() =>
          generateParamsForRoute(
            {
              request: { query: z.object({ randomName: TestQuery }) },
            },
            [TestQuery]
          )
        ).toThrow();
      });

      it('throws an error in case of missing name', () => {
        expect(() =>
          generateParamsForRoute({
            request: { headers: [z.string()] },
          })
        ).toThrow();
      });

      it('throws an error in case of missing location when registering a parameter', () => {
        const TestQuery = z
          .string()
          .openapi({ name: 'test', refId: 'TestQuery' });

        expect(() => generateParamsForRoute({}, [TestQuery])).toThrow();
      });
    });

    function generateParamsForRoute(
      props: Partial<RouteConfig> = {},
      paramsToRegister?: ZodSchema<any>[]
    ): OperationObject['parameters'] {
      const route = createTestRoute(props);

      const paramDefinitions =
        paramsToRegister?.map((schema) => ({
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
