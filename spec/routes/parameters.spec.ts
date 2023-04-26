import { OperationObject, PathItemObject } from 'openapi3-ts/oas30';
import { z, ZodSchema } from 'zod';
import { OpenAPIGenerator, RouteConfig } from '../../src';
import { MissingParameterDataError } from '../../src/errors';
import { createTestRoute, registerSchema, testDocConfig } from '../lib/helpers';

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

  it('generates a reference path parameter for route', () => {
    const TestParam = registerSchema('TestParam', z.string()).openapi({
      param: { name: 'test', in: 'path' },
    });

    const routeParameters = generateParamsForRoute(
      {
        request: { params: z.object({ test: TestParam }) },
      },
      [TestParam]
    );

    expect(routeParameters).toEqual([
      {
        $ref: '#/components/parameters/TestParam',
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
      try {
        generateParamsForRoute({
          method: 'get',
          path: '/path',
          request: { headers: [z.string()] },
        });

        expect("Should've thrown").toEqual('Did throw');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingParameterDataError);
        expect(error).toHaveProperty('data.location', 'header');
        expect(error).toHaveProperty('data.route', 'get /path');
      }
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
