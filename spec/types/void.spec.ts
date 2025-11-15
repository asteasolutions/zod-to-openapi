import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('void', () => {
  describe('in object properties', () => {
    it('skips void properties in objects', () => {
      const schema = z
        .object({
          id: z.string(),
          unused: z.void(),
          name: z.string(),
        })
        .openapi('TestObject');

      expectSchema([schema], {
        TestObject: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
          },
          required: ['id', 'name'],
        },
      });
    });

    it('does not mark void as required', () => {
      const schema = z
        .object({
          id: z.string(),
          unused: z.void(),
        })
        .openapi('TestObject');

      expectSchema([schema], {
        TestObject: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
          },
          required: ['id'],
        },
      });
    });

    it('skips optional void properties', () => {
      const schema = z
        .object({
          id: z.string(),
          unused: z.void().optional(),
        })
        .openapi('TestObject');

      expectSchema([schema], {
        TestObject: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
          },
          required: ['id'],
        },
      });
    });
  });

  describe('as direct schema', () => {
    it('allows z.void() as direct schema - returns empty schema', () => {
      const schema = z.void().openapi('DirectVoid');

      expectSchema([schema], {
        DirectVoid: {},
      });
    });

    it('returns empty schema for optional void at top level', () => {
      const schema = z.void().optional().openapi('OptionalVoid');

      expectSchema([schema], {
        OptionalVoid: {},
      });
    });

    it('returns empty schema for nullable void at top level', () => {
      const schema = z.void().nullable().openapi('NullableVoid');

      expectSchema([schema], {
        NullableVoid: {},
      });
    });
  });

  describe('in arrays', () => {
    it('allows z.void() in array - returns array with no items constraint', () => {
      const schema = z.array(z.void()).openapi('VoidArray');

      expectSchema([schema], {
        VoidArray: {
          type: 'array',
          items: {},
        },
      });
    });
  });

  describe('in unions', () => {
    it('filters void from union - only keeps non-void types', () => {
      const schema = z.union([z.string(), z.void()]).openapi('StringOrVoid');

      expectSchema([schema], {
        StringOrVoid: {
          type: 'string',
        },
      });
    });

    it('filters void from union with multiple types', () => {
      const schema = z
        .union([z.string(), z.number(), z.void()])
        .openapi('StringNumberOrVoid');

      expectSchema([schema], {
        StringNumberOrVoid: {
          anyOf: [{ type: 'string' }, { type: 'number' }],
        },
      });
    });

    it('returns empty schema for union with only void types', () => {
      const schema = z.union([z.void(), z.void()]).openapi('OnlyVoid');

      expectSchema([schema], {
        OnlyVoid: {},
      });
    });
  });
});


