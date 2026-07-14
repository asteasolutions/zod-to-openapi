import { z } from 'zod';
import { OpenAPIRegistry } from '../../src/openapi-registry';
import { generateV32Document } from './helpers';

describe('OpenAPI 3.2 routes', () => {
  describe('response object', () => {
    it('allows omitting description and setting summary', () => {
      const registry = new OpenAPIRegistry();

      registry.registerPath({
        method: 'get',
        path: '/r',
        responses: {
          200: {
            summary: 'A short summary',
            content: {
              'application/json': { schema: z.string() },
            },
          },
        },
      });

      const document = generateV32Document(registry);
      const response = document.paths?.['/r']?.get?.responses?.['200'];

      expect(response).toEqual({
        summary: 'A short summary',
        content: { 'application/json': { schema: { type: 'string' } } },
      });
    });

    it('allows reusable response components without descriptions', () => {
      const registry = new OpenAPIRegistry();

      const response = registry.registerComponent('responses', 'Accepted', {
        summary: 'Accepted',
      });

      registry.registerPath({
        method: 'get',
        path: '/accepted',
        responses: {
          202: response.ref,
        },
      });

      const document = generateV32Document(registry);

      expect(document.components?.responses?.['Accepted']).toEqual({
        summary: 'Accepted',
      });
      expect(document.paths?.['/accepted']?.get?.responses?.['202']).toEqual({
        $ref: '#/components/responses/Accepted',
      });
    });
  });

  describe('query method', () => {
    it('emits a query operation in the path item', () => {
      const registry = new OpenAPIRegistry();

      registry.registerPath({
        method: 'query',
        path: '/search',
        responses: {
          200: {
            description: 'Results',
            content: { 'application/json': { schema: z.array(z.string()) } },
          },
        },
      });

      const document = generateV32Document(registry);
      const pathItem = document.paths?.['/search'];

      expect(pathItem?.query).toBeDefined();
      expect(pathItem?.query?.responses?.['200']?.description).toEqual(
        'Results'
      );
    });
  });
});
