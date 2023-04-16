import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypeDescribe,
} from '../lib/helpers';

registrationTypeDescribe('refine', registrationType => {
  it('supports refined schemas', () => {
    expectSchema(
      [
        registerSchema(
          'RefinedString',
          z.number().refine(num => num % 2 === 0),
          registrationType
        ),
      ],
      {
        RefinedString: {
          type: 'number',
        },
      }
    );
  });

  it('supports required refined schemas', () => {
    expectSchema(
      [
        registerSchema(
          'ObjectWithRefinedString',
          z.object({
            test: z.number().refine(num => num && num % 2 === 0),
          }),
          registrationType
        ),
      ],
      {
        ObjectWithRefinedString: {
          type: 'object',
          properties: {
            test: {
              type: 'number',
            },
          },
          required: ['test'],
        },
      }
    );
  });

  it('supports optional refined schemas', () => {
    expectSchema(
      [
        registerSchema(
          'ObjectWithRefinedString',
          z.object({
            test: z.onumber().refine(num => num && num % 2 === 0),
          }),
          registrationType
        ),
      ],
      {
        ObjectWithRefinedString: {
          type: 'object',
          properties: {
            test: {
              type: 'number',
            },
          },
        },
      }
    );
  });

  it('supports optional refined schemas with default', () => {
    expectSchema(
      [
        registerSchema(
          'Object',
          z.object({
            test: z
              .onumber()
              .refine(num => num && num % 2 === 0)
              .default(42),
          }),
          registrationType
        ),
      ],
      {
        Object: {
          type: 'object',
          properties: {
            test: {
              type: 'number',
              default: 42,
            },
          },
        },
      }
    );
  });

  it('supports required refined schemas with default', () => {
    expectSchema(
      [
        registerSchema(
          'Object',
          z.object({
            test: z
              .number()
              .refine(num => num && num % 2 === 0)
              .default(42),
          }),
          registrationType
        ),
      ],
      {
        Object: {
          type: 'object',
          properties: {
            test: {
              type: 'number',
              default: 42,
            },
          },
          required: ['test'],
        },
      }
    );
  });

  it('supports refined transforms when type is provided', () => {
    expectSchema(
      [
        registerSchema(
          'Object',
          z.object({
            test: z
              .string()
              .transform(value => value.trim())
              .refine(val => val.length >= 1, 'Value not set.')
              .openapi({
                type: 'string',
              }),
          }),
          registrationType
        ),
      ],
      {
        Object: {
          type: 'object',
          properties: {
            test: {
              type: 'string',
            },
          },
          required: ['test'],
        },
      }
    );
  });
});
