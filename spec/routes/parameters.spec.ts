import { z } from 'zod';
import { MissingParameterDataError } from '../../src/errors';
import { generateDataForRoute, registerParameter } from '../lib/helpers';

describe('parameters', () => {
  describe('query', () => {
    it('generates a query parameter for route', () => {
      const { parameters } = generateDataForRoute({
        request: { query: z.object({ test: z.string() }) },
      });

      expect(parameters).toEqual([
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

    it('generates a deepPartial object query parameter for route', () => {
      const { parameters } = generateDataForRoute({
        request: {
          query: z
            .object({
              filter: z
                .object({ test: z.string() })
                .openapi({ param: { style: 'deepObject' } }),
            })
            .deepPartial(),
        },
      });

      expect(parameters).toEqual([
        {
          in: 'query',
          name: 'filter',
          required: false,
          style: 'deepObject',
          schema: {
            type: 'object',
            properties: {
              test: {
                type: 'string',
              },
            },
          },
        },
      ]);
    });

    it('generates a reference query parameter for route', () => {
      const TestQuery = registerParameter(
        'TestQuery',
        z.string().openapi({
          param: { name: 'test', in: 'query' },
        })
      );

      const { parameters, documentParameters } = generateDataForRoute(
        { request: { query: z.object({ test: TestQuery.schema }) } },
        [TestQuery]
      );

      expect(documentParameters).toEqual({
        TestQuery: {
          in: 'query',
          name: 'test',
          required: true,
          schema: {
            $ref: '#/components/schemas/TestQuery',
          },
        },
      });

      expect(parameters).toEqual([
        { $ref: '#/components/parameters/TestQuery' },
      ]);
    });

    it('can automatically register request query parameters', () => {
      const Person = z.object({ name: z.string() }).openapi('Person');

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
  });

  describe('path', () => {
    it('generates a path parameter for route', () => {
      const { parameters } = generateDataForRoute({
        request: { params: z.object({ test: z.string() }) },
      });

      expect(parameters).toEqual([
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

    it('generates a reference path parameter for route', () => {
      const TestParam = registerParameter(
        'TestParam',
        z.string().openapi({
          param: { name: 'test', in: 'path' },
        })
      );

      const { parameters, documentParameters } = generateDataForRoute(
        { request: { params: z.object({ test: TestParam.schema }) } },
        [TestParam]
      );

      expect(documentParameters).toEqual({
        TestParam: {
          in: 'path',
          name: 'test',
          required: true,
          schema: {
            $ref: '#/components/schemas/TestParam',
          },
        },
      });

      expect(parameters).toEqual([
        { $ref: '#/components/parameters/TestParam' },
      ]);
    });

    it('can automatically register request path parameters', () => {
      const UserId = z.string().openapi('UserId').length(6);

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
  });

  describe('cookies', () => {
    it('generates a cookie parameter for route', () => {
      const { parameters } = generateDataForRoute({
        request: { cookies: z.object({ test: z.string() }) },
      });

      expect(parameters).toEqual([
        {
          in: 'cookie',
          name: 'test',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ]);
    });

    it('generates a reference cookie parameter for route', () => {
      const TestParam = registerParameter(
        'TestParam',
        z.string().openapi({
          param: { name: 'test', in: 'cookie' },
        })
      );

      const { parameters, documentParameters } = generateDataForRoute(
        { request: { cookies: z.object({ test: TestParam.schema }) } },
        [TestParam]
      );

      expect(documentParameters).toEqual({
        TestParam: {
          in: 'cookie',
          name: 'test',
          required: true,
          schema: {
            $ref: '#/components/schemas/TestParam',
          },
        },
      });

      expect(parameters).toEqual([
        { $ref: '#/components/parameters/TestParam' },
      ]);
    });

    it('can automatically register request cookie parameters', () => {
      const cookieId = z.string().openapi('cookieId').length(6);

      const { documentSchemas, parameters } = generateDataForRoute({
        request: {
          cookies: z.object({
            id: cookieId,
          }),
        },
      });

      expect(documentSchemas).toEqual({
        cookieId: {
          type: 'string',
          minLength: 6,
          maxLength: 6,
        },
      });

      expect(parameters).toEqual([
        {
          in: 'cookie',
          name: 'id',
          required: true,
          schema: {
            $ref: '#/components/schemas/cookieId',
          },
        },
      ]);
    });
  });

  describe('header', () => {
    it('generates a header parameter with array for route', () => {
      const { parameters } = generateDataForRoute({
        request: {
          headers: z.object({ test: z.string() }),
        },
      });

      expect(parameters).toEqual([
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
      const { parameters } = generateDataForRoute({
        request: {
          headers: [z.string().openapi({ param: { name: 'test' } })],
        },
      });

      expect(parameters).toEqual([
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
      const TestHeader = registerParameter(
        'TestHeader',
        z.string().openapi({
          param: { name: 'test', in: 'header' },
        })
      );

      const { parameters, documentParameters } = generateDataForRoute(
        { request: { headers: [TestHeader.schema] } },
        [TestHeader]
      );

      expect(documentParameters).toEqual({
        TestHeader: {
          in: 'header',
          name: 'test',
          required: true,
          schema: {
            $ref: '#/components/schemas/TestHeader',
          },
        },
      });

      expect(parameters).toEqual([
        { $ref: '#/components/parameters/TestHeader' },
      ]);
    });

    it('can automatically register request header parameters', () => {
      const SessionToken = z.string().openapi('SessionToken').length(6);

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
  });

  it('combines parameter definitions', () => {
    const { parameters } = generateDataForRoute({
      request: {
        query: z.object({ request_queryId: z.string() }),
        params: z.object({ request_paramsId: z.string() }),
      },
      parameters: [
        { in: 'query', name: 'params_queryId' },
        { in: 'path', name: 'params_pathId' },
      ],
    });

    expect(parameters).toEqual([
      { in: 'query', name: 'params_queryId' },
      { in: 'path', name: 'params_pathId' },
      {
        schema: { type: 'string' },
        required: true,
        name: 'request_paramsId',
        in: 'path',
      },
      {
        schema: { type: 'string' },
        required: true,
        name: 'request_queryId',
        in: 'query',
      },
    ]);
  });

  it('generates required based on inner schema', () => {
    const { parameters } = generateDataForRoute({
      request: {
        query: z.object({ test: z.string().optional().default('test') }),
      },
    });

    expect(parameters).toEqual([
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
    const { parameters } = generateDataForRoute({
      request: {
        query: z.strictObject({
          test: z.string().optional().default('test'),
        }),
      },
    });

    expect(parameters).toEqual([
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
        generateDataForRoute({
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
        generateDataForRoute({
          request: {
            query: z.object({
              test: z.string().openapi({ param: { in: 'header' } }),
            }),
          },
        })
      ).toThrowError(/^Conflicting location/);
    });

    it('throws an error in case of location mismatch with reference', () => {
      const TestHeader = registerParameter(
        'TestHeader',
        z.string().openapi({
          param: { name: 'test', in: 'header' },
        })
      );

      expect(() =>
        generateDataForRoute(
          {
            request: { query: z.object({ test: TestHeader.schema }) },
          },
          [TestHeader]
        )
      ).toThrowError(/^Conflicting location/);
    });

    it('throws an error in case of name mismatch with reference', () => {
      const TestQuery = registerParameter(
        'TestQuery',
        z.string().openapi({
          param: { name: 'test', in: 'query' },
        })
      );

      expect(() =>
        generateDataForRoute(
          {
            request: { query: z.object({ randomName: TestQuery.schema }) },
          },
          [TestQuery]
        )
      ).toThrowError(/^Conflicting name/);
    });

    it('throws an error in case of missing name', () => {
      try {
        generateDataForRoute({
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
      const TestQuery = registerParameter(
        'TestQuery',
        z.string().openapi({
          param: { name: 'test' },
        })
      );

      expect(() => generateDataForRoute({}, [TestQuery])).toThrowError(
        /^Missing parameter data, please specify `in`/
      );
    });
  });
});
