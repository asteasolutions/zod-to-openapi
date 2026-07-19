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

  it('supports nullable enums', () => {
    const schema = z
      .enum(['option1', 'option2'])
      .nullable()
      .openapi('Enum', { description: 'All possible options' });

    expectSchema([schema], {
      Enum: {
        type: 'string',
        nullable: true,
        description: 'All possible options',
        enum: ['option1', 'option2', null],
      },
    });
  });

  it('does not pollute registered enum component when used as nullable', () => {
    const Brand = z.enum(['Ford', 'Toyota', 'Tesla']).openapi('Brand');

    const Car = z
      .object({
        brand: Brand.nullable(),
        model: z.string(),
      })
      .openapi('Car');

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
          model: { type: 'string' },
        },
        required: ['brand', 'model'],
      },
    });
  });

  it('does not pollute registered enum component when used as nullable in 3.1.0', () => {
    const Brand = z.enum(['Ford', 'Toyota', 'Tesla']).openapi('Brand');

    const Car = z
      .object({
        brand: Brand.nullable(),
        model: z.string(),
      })
      .openapi('Car');

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
            model: { type: 'string' },
          },
          required: ['brand', 'model'],
        },
      },
      { version: '3.1.0' }
    );
  });

  it('does not pollute enum component when first discovered through nullable usage', () => {
    const Brand = z.enum(['Ford', 'Toyota', 'Tesla']).openapi('Brand');

    const Car = z
      .object({
        brand: Brand.nullable(),
        model: z.string(),
      })
      .openapi('Car');

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
          model: { type: 'string' },
        },
        required: ['brand', 'model'],
      },
    });
  });
});
