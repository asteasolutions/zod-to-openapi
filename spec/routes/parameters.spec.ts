import { z } from 'zod';
import { MissingParameterDataError } from '../../src/errors';
import { generateDataForRoute, registerParameter } from '../lib/helpers';

describe('parameters', () => {
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

    expect(parameters).toEqual([{ $ref: '#/components/parameters/TestQuery' }]);
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

    expect(parameters).toEqual([{ $ref: '#/components/parameters/TestParam' }]);
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
