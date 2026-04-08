import z from 'zod';
import {
  OpenApiGeneratorV3,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from '../src';

const generators = [
  { describeName: 'OpenApiGeneratorV31', Generator: OpenApiGeneratorV31 },
  { describeName: 'OpenApiGeneratorV3', Generator: OpenApiGeneratorV3 },
];

describe('OpenApiGenerator - sorting', () => {
  generators.forEach(({ describeName, Generator }) => {
    describe(`With ${describeName}`, () => {
      it('does not sort schemas by default', () => {
        const schemaA = z.string().openapi('A');
        const schemaB = z.string().openapi('B');
        const schemaC = z.string().openapi('C');

        const generator = new Generator([schemaC, schemaA, schemaB]);

        const { components } = generator.generateComponents();

        expect(components?.schemas).toBeDefined();
        const generatedSchemas = Object.entries(components?.schemas!);

        expect(generatedSchemas).toEqual([
          ['C', { type: 'string' }],
          ['A', { type: 'string' }],
          ['B', { type: 'string' }],
        ]);
      });

      it('supports sorting schemas alphabetically', () => {
        const schemaA = z.string().openapi('A');
        const schemaB = z.string().openapi('B');
        const schemaC = z.string().openapi('C');

        const generator = new Generator([schemaC, schemaA, schemaB], {
          sortComponents: 'alphabetically',
        });

        const { components } = generator.generateComponents();

        expect(components?.schemas).toBeDefined();
        const generatedSchemas = Object.entries(components?.schemas!);

        expect(generatedSchemas).toEqual([
          ['A', { type: 'string' }],
          ['B', { type: 'string' }],
          ['C', { type: 'string' }],
        ]);
      });

      it('does not sort parameters by default', () => {
        const registry = new OpenAPIRegistry();

        const baseSchema = z.string().openapi({ param: { in: 'query' } });
        registry.registerParameter('C', baseSchema);
        registry.registerParameter('A', baseSchema);
        registry.registerParameter('B', baseSchema);

        const generator = new Generator(registry.definitions);

        const { components } = generator.generateComponents();

        expect(components?.parameters).toBeDefined();
        const generatedParameters = Object.entries(components?.parameters!);

        const getExpectedSchema = (name: 'A' | 'B' | 'C') => ({
          in: 'query',
          required: true,
          name,
          schema: {
            $ref: `#/components/schemas/${name}`,
          },
        });

        expect(generatedParameters).toEqual([
          ['C', getExpectedSchema('C')],
          ['A', getExpectedSchema('A')],
          ['B', getExpectedSchema('B')],
        ]);
      });

      it('supports sorting parameters alphabetically', () => {
        const registry = new OpenAPIRegistry();

        const baseSchema = z.string().openapi({ param: { in: 'query' } });
        registry.registerParameter('C', baseSchema);
        registry.registerParameter('A', baseSchema);
        registry.registerParameter('B', baseSchema);

        const generator = new Generator(registry.definitions, {
          sortComponents: 'alphabetically',
        });

        const { components } = generator.generateComponents();

        expect(components?.parameters).toBeDefined();
        const generatedParameters = Object.entries(components?.parameters!);

        const getExpectedSchema = (name: 'A' | 'B' | 'C') => ({
          in: 'query',
          required: true,
          name,
          schema: {
            $ref: `#/components/schemas/${name}`,
          },
        });

        expect(generatedParameters).toEqual([
          ['A', getExpectedSchema('A')],
          ['B', getExpectedSchema('B')],
          ['C', getExpectedSchema('C')],
        ]);
      });
    });
  });
});
