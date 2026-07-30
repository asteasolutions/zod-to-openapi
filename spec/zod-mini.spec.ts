import * as mini from 'zod/mini';
import { z } from 'zod';
import { Metadata } from '../src/metadata';

/**
 * `zod` and `zod/mini` both extend the same core classes, and metadata for both lives in zod's core
 * registry. Reading it must therefore not depend on the classic `.meta()` method, which `zod/mini`
 * schemas do not expose.
 */
describe('zod/mini schemas', () => {
  it('reads metadata registered through zod core', () => {
    const schema = mini.object({ id: mini.uuid() });
    z.core.globalRegistry.add(schema, { description: 'a mini schema' });

    expect(Metadata.getMetadataFromRegistry(schema as never)).toEqual({
      description: 'a mini schema',
    });
  });

  it('does not throw when a schema carries no metadata', () => {
    expect(() =>
      Metadata.getMetadataFromRegistry(mini.string() as never)
    ).not.toThrow();
  });

  it('still reads metadata written with the classic .meta() method', () => {
    const schema = z.string().meta({ description: 'a classic schema' });

    expect(Metadata.getMetadataFromRegistry(schema)).toMatchObject({
      description: 'a classic schema',
    });
  });
});
