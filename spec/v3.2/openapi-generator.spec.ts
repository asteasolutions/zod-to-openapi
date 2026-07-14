import { z } from 'zod';
import { OpenAPIRegistry } from '../../src/openapi-registry';
import { expectSchema } from '../lib/helpers';
import { generateV32Document } from './helpers';

describe('OpenApiGeneratorV32', () => {
  it('keeps the 3.2 openapi version supplied by the config', () => {
    const document = generateV32Document(new OpenAPIRegistry());

    expect(document.openapi).toEqual('3.2.0');
  });

  it('emits the same JSON Schema dialect as 3.1 (type arrays for nullable)', () => {
    expectSchema(
      [z.string().nullable().openapi('NullableString')],
      {
        NullableString: { type: ['string', 'null'] },
      },
      { version: '3.2.0' }
    );
  });
});
