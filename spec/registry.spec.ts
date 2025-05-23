import { z } from 'zod';
import { OpenAPIRegistry } from '../src';
import { ZodOpenApiFullMetadata } from '../src/zod-extensions';
import { Metadata } from '../src/metadata';
import { OpenAPIDefinitions } from '../src/openapi-registry';

function expectToHaveDefinitionMetadata(
  definition: OpenAPIDefinitions | undefined,
  type: 'schema' | 'parameter',
  expectedMetadata: ZodOpenApiFullMetadata
) {
  expect(definition?.type).toEqual(type);

  if (definition?.type !== type) {
    throw new Error(); // checked above. this is for type safety only
  }

  return expect(Metadata.getMetadata(definition?.schema)).toEqual(
    expectedMetadata
  );
}

describe('OpenAPIRegistry', () => {
  it('can create schema definition', () => {
    const registry = new OpenAPIRegistry();

    const schema = registry.register('Test', z.string());

    expect(registry.definitions.length).toEqual(1);
    expectToHaveDefinitionMetadata(registry.definitions?.[0], 'schema', {
      _internal: { refId: 'Test' },
    });
  });

  it('can create schema definition with additional metadata', () => {
    const registry = new OpenAPIRegistry();

    registry.register(
      'Test',
      z.string().openapi({ description: 'Some string', deprecated: true })
    );

    expect(registry.definitions.length).toEqual(1);
    expectToHaveDefinitionMetadata(registry.definitions?.[0], 'schema', {
      _internal: { refId: 'Test' },
      metadata: { description: 'Some string', deprecated: true },
    });
  });

  it('can create parameter definition', () => {
    const registry = new OpenAPIRegistry();

    registry.registerParameter('Test', z.string());

    expect(registry.definitions.length).toEqual(1);
    expectToHaveDefinitionMetadata(registry.definitions?.[0], 'parameter', {
      _internal: { refId: 'Test' },
      metadata: { param: { name: 'Test' } },
    });
  });

  it('can create parameter definition with additional metadata', () => {
    const registry = new OpenAPIRegistry();

    registry.registerParameter(
      'Test',
      z.string().openapi({ description: 'Some string', param: { in: 'query' } })
    );

    expect(registry.definitions.length).toEqual(1);
    expectToHaveDefinitionMetadata(registry.definitions?.[0], 'parameter', {
      _internal: { refId: 'Test' },
      metadata: {
        description: 'Some string',
        param: { name: 'Test', in: 'query' },
      },
    });
  });

  it('preserves name given with .openapi over the reference name', () => {
    const registry = new OpenAPIRegistry();

    registry.registerParameter(
      'referenceName',
      z.string().openapi({ param: { name: 'actualName' } })
    );

    expect(registry.definitions.length).toEqual(1);
    expectToHaveDefinitionMetadata(registry.definitions?.[0], 'parameter', {
      _internal: { refId: 'referenceName' },
      metadata: { param: { name: 'actualName' } },
    });
  });
});
