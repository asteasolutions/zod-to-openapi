import * as z from 'zod';
import { extendZodWithOpenApi } from '../src/zod-extensions';
import { expectSchema } from './lib/helpers';

// TODO: setupTests.ts
extendZodWithOpenApi(z);

describe('Polymorphism', () => {
  it('can use allOf', () => {
    const BaseSchema = z.ZodObject.create({ id: z.string() }).openapi({ refId: 'Base' });

    const ExtendedSchema = BaseSchema.extend({ bonus: z.number() }).openapi({ refId: 'Extended'});

    const TestSchema = z.object({ key: ExtendedSchema.nullable().openapi({ deprecated: true, refId: 'Test' }) });


    expectSchema([BaseSchema, ExtendedSchema, TestSchema], {
      Base: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string'
          }
        }
      },
      Extended: { 
        allOf: [
          { $ref: '#/components/schemas/Base' },
          {
            type: 'object',
            required: ['bonus'],              
            properties: {
              bonus: {
                type: 'number'
              }
            }
          }
        ]
      }
    });
  });

  it.todo('can apply nullable');

  it.todo('can apply optional');

  it.todo('can apply openapi');
});
