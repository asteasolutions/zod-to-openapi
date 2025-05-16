import { z } from 'zod';
import { OpenAPIRegistry } from '../src';
import { ZodOpenApiFullMetadata } from '../src/zod-extensions';

function expectToHaveMetadata(expectedMetadata: ZodOpenApiFullMetadata) {
  return expect.objectContaining({
    def: expect.objectContaining({
      openapi: expectedMetadata,
    }),
  });
}

describe('OpenAPIRegistry', () => {
  it('can create schema definition', () => {
    const registry = new OpenAPIRegistry();

    registry.register('Test', z.string());

    expect(registry.definitions).toEqual([
      {
        type: 'schema',
        schema: expectToHaveMetadata({ _internal: { refId: 'Test' } }),
      },
    ]);
  });

  it('can create schema definition with additional metadata', () => {
    const registry = new OpenAPIRegistry();

    registry.register(
      'Test',
      z.string().openapi({ description: 'Some string', deprecated: true })
    );

    expect(registry.definitions).toEqual([
      {
        type: 'schema',
        schema: expectToHaveMetadata({
          _internal: { refId: 'Test' },
          metadata: { description: 'Some string', deprecated: true },
        }),
      },
    ]);
  });

  it('can create parameter definition', () => {
    const registry = new OpenAPIRegistry();

    registry.registerParameter('Test', z.string());

    expect(registry.definitions).toEqual([
      {
        type: 'parameter',
        schema: expectToHaveMetadata({
          _internal: { refId: 'Test' },
          metadata: { param: { name: 'Test' } },
        }),
      },
    ]);
  });

  it('can create parameter definition with additional metadata', () => {
    const registry = new OpenAPIRegistry();

    registry.registerParameter(
      'Test',
      z.string().openapi({ description: 'Some string', param: { in: 'query' } })
    );

    expect(registry.definitions).toEqual([
      {
        type: 'parameter',
        schema: expectToHaveMetadata({
          _internal: { refId: 'Test' },
          metadata: {
            description: 'Some string',
            param: { name: 'Test', in: 'query' },
          },
        }),
      },
    ]);
  });

  it('preserves name given with .openapi over the reference name', () => {
    const registry = new OpenAPIRegistry();

    registry.registerParameter(
      'referenceName',
      z.string().openapi({ param: { name: 'actualName' } })
    );

    expect(registry.definitions).toEqual([
      {
        type: 'parameter',
        schema: expectToHaveMetadata({
          _internal: { refId: 'referenceName' },
          metadata: {
            param: { name: 'actualName' },
          },
        }),
      },
    ]);
  });
});
