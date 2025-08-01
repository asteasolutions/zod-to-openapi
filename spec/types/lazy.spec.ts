import { z, ZodObject } from 'zod';
import { expectSchema } from '../lib/helpers';
import { Metadata } from '../../src/metadata';
import { required } from 'zod/v4/core/util.cjs';

// Based on the "Any Type" section of https://swagger.io/docs/specification/data-models/data-types/

describe('lazy', () => {
  it('supports not registered lazy schemas', () => {
    const schema = z.object({ key: z.lazy(() => z.string()) }).openapi('Test');

    expectSchema([schema], {
      Test: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
          },
        },
        required: ['key'],
      },
    });
  });

  it('supports registered non-recursive lazy schemas', () => {
    const lazySchema = z.lazy(() => z.string()).openapi('LazyString');

    expectSchema([lazySchema], {
      LazyString: {
        type: 'string',
      },
    });
  });

  it('supports registered recursive lazy schemas', () => {
    const baseCategorySchema = z.object({
      name: z.string(),
    });

    type Category = z.infer<typeof baseCategorySchema> & {
      subcategory: Category;
    };

    const categorySchema: z.ZodType<Category> = baseCategorySchema
      .extend({
        subcategory: z.lazy(() => categorySchema),
      })
      .openapi('Category');

    expectSchema([categorySchema], {
      Category: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          subcategory: {
            $ref: '#/components/schemas/Category',
          },
        },
        required: ['name', 'subcategory'],
      },
    });
  });
});
