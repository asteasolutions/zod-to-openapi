import { z } from 'zod';
import { OpenAPIGenerator2 } from '../src/openapi-generator-2';
import { testDocConfig } from './lib/helpers';

const ads: unknown = { a: 3 };

describe('Automatic registration', () => {
  it('can automatically register schemas', () => {
    const schema = z.string().refId('Test');

    const document = new OpenAPIGenerator2([schema], '3.0.0').generateDocument(
      testDocConfig
    );

    console.log(document);

    expect(document.components?.schemas).toEqual({
      Test: {
        type: 'string',
      },
    });
  });

  it('can automatically register nested schemas', () => {
    const schema = z.object({ key: z.string().refId('Test') }).refId('Object');

    const document = new OpenAPIGenerator2([schema], '3.0.0').generateDocument(
      testDocConfig
    );

    console.log(document);

    expect(document.components?.schemas).toEqual({
      Test: {
        type: 'string',
      },

      Object: {
        type: 'object',
        properties: {
          key: {
            $ref: '#/components/schemas/Test',
          },
        },
        required: ['key'],
      },
    });
  });
});
