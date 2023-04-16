import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypes,
} from '../lib/helpers';

registrationTypes.forEach(registrationType => {
  describe('optional', () => {
    it('generates OpenAPI schema for optional after the metadata', () => {
      expectSchema(
        [
          registerSchema(
            'SimpleString',
            z.string(),
            registrationType
          ).optional(),
        ],
        {
          SimpleString: { type: 'string' },
        }
      );
    });

    it('generates OpenAPI schema for optional before the metadata', () => {
      expectSchema(
        [
          registerSchema(
            'SimpleString',
            z.string(),
            registrationType
          ).optional(),
        ],
        {
          SimpleString: { type: 'string' },
        }
      );
    });

    it('supports optional nullable', () => {
      expectSchema(
        [
          registerSchema(
            'SimpleObject',
            z.object({
              test: z.string().nullable().optional(),
            }),
            registrationType
          ),
        ],
        {
          SimpleObject: {
            type: 'object',
            properties: {
              test: {
                nullable: true,
                type: 'string',
              },
            },
          },
        }
      );
    });
  });
});
