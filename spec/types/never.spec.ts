import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('never', () => {
  describe('in object properties', () => {
    it('skips never properties in objects', () => {
      const schema = z
        .object({
          id: z.string(),
          impossible: z.never(),
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

    it('does not mark never as required', () => {
      const schema = z
        .object({
          id: z.string(),
          impossible: z.never(),
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

    it('skips optional never properties', () => {
      const schema = z
        .object({
          id: z.string(),
          impossible: z.never().optional(),
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
    it('allows z.never() as direct schema - returns empty schema', () => {
      const schema = z.never().openapi('DirectNever');

      expectSchema([schema], {
        DirectNever: {},
      });
    });

    it('returns empty schema for optional never at top level', () => {
      const schema = z.never().optional().openapi('OptionalNever');

      expectSchema([schema], {
        OptionalNever: {},
      });
    });

    it('returns empty schema for nullable never at top level', () => {
      const schema = z.never().nullable().openapi('NullableNever');

      expectSchema([schema], {
        NullableNever: {},
      });
    });
  });

  describe('in arrays', () => {
    it('allows z.never() in array - returns array with no items constraint', () => {
      const schema = z.array(z.never()).openapi('NeverArray');

      expectSchema([schema], {
        NeverArray: {
          type: 'array',
          items: {},
        },
      });
    });
  });

  describe('in unions', () => {
    it('filters never from union - only keeps non-never types', () => {
      const schema = z.union([z.string(), z.never()]).openapi('StringOrNever');

      expectSchema([schema], {
        StringOrNever: {
          type: 'string',
        },
      });
    });

    it('filters never from union with multiple types', () => {
      const schema = z
        .union([z.string(), z.number(), z.never()])
        .openapi('StringNumberOrNever');

      expectSchema([schema], {
        StringNumberOrNever: {
          anyOf: [{ type: 'string' }, { type: 'number' }],
        },
      });
    });

    it('returns empty schema for union with only never types', () => {
      const schema = z.union([z.never(), z.never()]).openapi('OnlyNever');

      expectSchema([schema], {
        OnlyNever: {},
      });
    });
  });
});
