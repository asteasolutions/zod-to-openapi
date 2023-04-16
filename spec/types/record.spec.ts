import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypes,
} from '../lib/helpers';

registrationTypes.forEach(registrationType => {
  describe('record', () => {
    it('supports records', () => {
      const base = z.object({ a: z.string() });

      const record = registerSchema('Record', z.record(base), registrationType);

      expectSchema([base, record], {
        Record: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              a: { type: 'string' },
            },
            required: ['a'],
          },
        },
      });
    });

    it('supports records with refs', () => {
      const base = registerSchema(
        'Base',
        z.object({ a: z.string() }),
        registrationType
      );

      const record = registerSchema('Record', z.record(base), registrationType);

      expectSchema([base, record], {
        Base: {
          type: 'object',
          properties: {
            a: { type: 'string' },
          },
          required: ['a'],
        },
        Record: {
          type: 'object',
          additionalProperties: {
            $ref: '#/components/schemas/Base',
          },
        },
      });
    });
  });
});
