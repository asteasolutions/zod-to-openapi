import { z } from 'zod';
import { OpenAPIRegistry } from '../src/openapi-registry';
import {
  OpenApiGeneratorV32,
  OpenAPIObjectConfigV32,
} from '../src/v3.2/openapi-generator';

const testDocConfig: OpenAPIObjectConfigV32 = {
  openapi: '3.2.0',
  info: { version: '1.0.0', title: 'Test API' },
};

function generate(registry: OpenAPIRegistry) {
  return new OpenApiGeneratorV32(registry.definitions).generateDocument(
    testDocConfig
  );
}

describe('OpenApiGeneratorV32', () => {
  it('keeps the 3.2 openapi version supplied by the config', () => {
    const document = generate(new OpenAPIRegistry());

    expect(document.openapi).toEqual('3.2.0');
  });

  it('emits the same JSON Schema dialect as 3.1 (type arrays for nullable)', () => {
    const registry = new OpenAPIRegistry();
    registry.register('NullableString', z.string().nullable());

    const document = generate(registry);

    expect(document.components?.schemas?.['NullableString']).toEqual({
      type: ['string', 'null'],
    });
  });

  describe('itemSchema', () => {
    it('converts a Zod itemSchema and registers it as a component ref', () => {
      const registry = new OpenAPIRegistry();

      const Event = registry.register(
        'Event',
        z.object({ message: z.string() })
      );

      registry.registerPath({
        method: 'get',
        path: '/events',
        responses: {
          200: {
            description: 'Event stream',
            content: {
              'text/event-stream': {
                itemSchema: Event,
              },
            },
          },
        },
      });

      const document = generate(registry);
      const content =
        document.paths?.['/events']?.get?.responses?.['200']?.content?.[
          'text/event-stream'
        ];

      expect(content).toEqual({
        itemSchema: { $ref: '#/components/schemas/Event' },
      });
      expect(document.components?.schemas?.['Event']).toEqual({
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message'],
      });
    });

    it('inlines an inline Zod itemSchema', () => {
      const registry = new OpenAPIRegistry();

      registry.registerPath({
        method: 'get',
        path: '/lines',
        responses: {
          200: {
            description: 'JSON lines',
            content: {
              'application/jsonl': {
                itemSchema: z.object({ value: z.number() }),
              },
            },
          },
        },
      });

      const document = generate(registry);
      const content =
        document.paths?.['/lines']?.get?.responses?.['200']?.content?.[
          'application/jsonl'
        ];

      expect(content).toEqual({
        itemSchema: {
          type: 'object',
          properties: { value: { type: 'number' } },
          required: ['value'],
        },
      });
    });

    it('passes a raw SchemaObject itemSchema through untouched', () => {
      const registry = new OpenAPIRegistry();

      registry.registerPath({
        method: 'get',
        path: '/raw',
        responses: {
          200: {
            description: 'Raw item schema',
            content: {
              'application/json-seq': {
                itemSchema: { type: 'string' },
              },
            },
          },
        },
      });

      const document = generate(registry);
      const content =
        document.paths?.['/raw']?.get?.responses?.['200']?.content?.[
          'application/json-seq'
        ];

      expect(content).toEqual({ itemSchema: { type: 'string' } });
    });

    it('supports both schema and itemSchema on the same media type', () => {
      const registry = new OpenAPIRegistry();

      registry.registerPath({
        method: 'get',
        path: '/both',
        responses: {
          200: {
            description: 'Both',
            content: {
              'multipart/mixed': {
                schema: z.object({ id: z.string() }),
                itemSchema: z.object({ chunk: z.string() }),
              },
            },
          },
        },
      });

      const document = generate(registry);
      const content =
        document.paths?.['/both']?.get?.responses?.['200']?.content?.[
          'multipart/mixed'
        ];

      expect(content).toEqual({
        schema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        itemSchema: {
          type: 'object',
          properties: { chunk: { type: 'string' } },
          required: ['chunk'],
        },
      });
    });

    it('includes webhook-only named itemSchemas in components', () => {
      const registry = new OpenAPIRegistry();

      registry.registerWebhook({
        method: 'post',
        path: 'eventCreated',
        responses: {
          200: {
            description: 'Event stream',
            content: {
              'application/jsonl': {
                itemSchema: z.object({ message: z.string() }).openapi('Event'),
              },
            },
          },
        },
      });

      const document = generate(registry);
      const content =
        document.webhooks?.['eventCreated']?.post?.responses?.['200']
          ?.content?.['application/jsonl'];

      expect(content).toEqual({
        itemSchema: { $ref: '#/components/schemas/Event' },
      });
      expect(document.components?.schemas?.['Event']).toEqual({
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message'],
      });
    });
  });

  describe('response object', () => {
    it('allows omitting description (optional since 3.2) and setting summary', () => {
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

      const document = generate(registry);
      const response = document.paths?.['/r']?.get?.responses?.['200'];

      expect(response).toEqual({
        summary: 'A short summary',
        content: { 'application/json': { schema: { type: 'string' } } },
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

      const document = generate(registry);
      const pathItem = document.paths?.['/search'] as Record<string, unknown>;

      expect(pathItem?.['query']).toBeDefined();
      expect(
        (document.paths?.['/search'] as any)?.query?.responses?.['200']
          ?.description
      ).toEqual('Results');
    });
  });

  describe('reusable media types', () => {
    it('allows a 3.2 media type component to be referenced from content', () => {
      const registry = new OpenAPIRegistry();

      registry.registerComponent('mediaTypes', 'JsonLine', {
        itemSchema: { type: 'string' },
      });

      registry.registerPath({
        method: 'get',
        path: '/logs',
        responses: {
          200: {
            description: 'Log stream',
            content: {
              'application/jsonl': {
                $ref: '#/components/mediaTypes/JsonLine',
              },
            },
          },
        },
      });

      const document = generate(registry);

      expect(document.components?.mediaTypes?.['JsonLine']).toEqual({
        itemSchema: { type: 'string' },
      });
      expect(
        document.paths?.['/logs']?.get?.responses?.['200']?.content?.[
          'application/jsonl'
        ]
      ).toEqual({ $ref: '#/components/mediaTypes/JsonLine' });
    });
  });

  describe('media type encoding', () => {
    it('passes 3.2 itemEncoding and prefixEncoding through untouched', () => {
      const registry = new OpenAPIRegistry();

      registry.registerPath({
        method: 'post',
        path: '/upload',
        request: {
          body: {
            content: {
              'multipart/mixed': {
                itemSchema: z.string(),
                prefixEncoding: [{ contentType: 'text/plain' }],
                itemEncoding: { contentType: 'image/png' },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
          },
        },
      });

      const document = generate(registry);

      expect(
        (document.paths?.['/upload']?.post?.requestBody as any)?.content?.[
          'multipart/mixed'
        ]
      ).toEqual({
        itemSchema: { type: 'string' },
        prefixEncoding: [{ contentType: 'text/plain' }],
        itemEncoding: { contentType: 'image/png' },
      });
    });
  });
});
