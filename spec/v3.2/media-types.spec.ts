import { z } from 'zod';
import { OpenAPIRegistry } from '../../src/openapi-registry';
import { generateV32Document } from './helpers';

describe('OpenAPI 3.2 media types', () => {
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

      const document = generateV32Document(registry);
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

      const document = generateV32Document(registry);
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

      const document = generateV32Document(registry);
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

      const document = generateV32Document(registry);
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

      const document = generateV32Document(registry);
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

  describe('reusable media types', () => {
    it('allows a media type component to be referenced from content', () => {
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

      const document = generateV32Document(registry);

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
    it('passes itemEncoding and prefixEncoding through untouched', () => {
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

      const document = generateV32Document(registry);
      const requestBody = document.paths?.['/upload']?.post?.requestBody;

      if (!requestBody || '$ref' in requestBody) {
        throw new Error('Expected an inline request body');
      }

      expect(requestBody.content['multipart/mixed']).toEqual({
        itemSchema: { type: 'string' },
        prefixEncoding: [{ contentType: 'text/plain' }],
        itemEncoding: { contentType: 'image/png' },
      });
    });
  });
});
