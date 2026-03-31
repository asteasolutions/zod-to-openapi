import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('enum', () => {
  it('supports enums', () => {
    const schema = z
      .enum(['option1', 'option2'])
      .openapi('Enum', { description: 'All possible options' });

    expectSchema([schema], {
      Enum: {
        type: 'string',
        description: 'All possible options',
        enum: ['option1', 'option2'],
      },
    });
  });

  it('does not pollute enum component with nullable when .openapi() is before .nullable()', () => {
    const Brand = z.enum(['Ford', 'Toyota', 'Tesla']).openapi('Brand');

    const Car = z.object({ brand: Brand.nullable() }).openapi('Car');

    expectSchema([Brand, Car], {
      Brand: {
        type: 'string',
        enum: ['Ford', 'Toyota', 'Tesla'],
      },
      Car: {
        type: 'object',
        properties: {
          brand: {
            allOf: [
              { $ref: '#/components/schemas/Brand' },
              { nullable: true },
            ],
          },
        },
        required: ['brand'],
      },
    });
  });

  it('does not pollute enum component with nullable in open api 3.1.0', () => {
    const Brand = z.enum(['Ford', 'Toyota', 'Tesla']).openapi('Brand');

    const Car = z.object({ brand: Brand.nullable() }).openapi('Car');

    expectSchema(
      [Brand, Car],
      {
        Brand: {
          type: 'string',
          enum: ['Ford', 'Toyota', 'Tesla'],
        },
        Car: {
          type: 'object',
          properties: {
            brand: {
              allOf: [
                { $ref: '#/components/schemas/Brand' },
                { type: ['string', 'null'] },
              ],
            },
          },
          required: ['brand'],
        },
      },
      '3.1.0'
    );
  });

  it('keeps nullable in component when .nullable() is before .openapi()', () => {
    const NullableBrand = z
      .enum(['Ford', 'Toyota', 'Tesla'])
      .nullable()
      .openapi('NullableBrand');

    expectSchema([NullableBrand], {
      NullableBrand: {
        type: 'string',
        nullable: true,
        enum: ['Ford', 'Toyota', 'Tesla'],
      },
    });
  });

  it('handles nullable enum registered only through object property', () => {
    const Brand = z.enum(['Ford', 'Toyota', 'Tesla']).openapi('Brand');

    const Car = z.object({ brand: Brand.nullable() }).openapi('Car');

    expectSchema([Car], {
      Brand: {
        type: 'string',
        enum: ['Ford', 'Toyota', 'Tesla'],
      },
      Car: {
        type: 'object',
        properties: {
          brand: {
            allOf: [
              { $ref: '#/components/schemas/Brand' },
              { nullable: true },
            ],
          },
        },
        required: ['brand'],
      },
    });
  });
});
