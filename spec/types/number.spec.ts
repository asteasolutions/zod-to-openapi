import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypeDescribe,
} from '../lib/helpers';

registrationTypeDescribe('number', registrationType => {
  it('generates OpenAPI schema for a simple number type', () => {
    expectSchema(
      [registerSchema('SimpleNumber', z.number(), registrationType)],
      {
        SimpleNumber: { type: 'number' },
      }
    );
  });

  it('generates OpenAPI schema for a simple integer type', () => {
    expectSchema(
      [registerSchema('SimpleInteger', z.number().int(), registrationType)],
      {
        SimpleInteger: { type: 'integer' },
      }
    );
  });

  it('supports number literals', () => {
    expectSchema([registerSchema('Literal', z.literal(42), registrationType)], {
      Literal: { type: 'number', enum: [42] },
    });
  });

  it('supports minimum in open api 3.0.0', () => {
    expectSchema(
      [
        registerSchema(
          'SimpleInteger',
          z.number().int().gte(0),
          registrationType
        ),
      ],
      {
        SimpleInteger: { type: 'integer', minimum: 0 },
      }
    );
  });

  it('supports exclusive minimum in open api 3.0.0', () => {
    expectSchema(
      [
        registerSchema(
          'SimpleInteger',
          z.number().int().gt(0),
          registrationType
        ),
      ],
      {
        SimpleInteger: {
          type: 'integer',
          minimum: 0,
          exclusiveMinimum: true,
        },
      }
    );
  });

  it('supports maximum in open api 3.0.0', () => {
    expectSchema(
      [
        registerSchema(
          'SimpleInteger',
          z.number().int().lte(0),
          registrationType
        ),
      ],
      {
        SimpleInteger: { type: 'integer', maximum: 0 },
      }
    );
  });

  it('supports exclusive maximum in open api 3.0.0', () => {
    expectSchema(
      [
        registerSchema(
          'SimpleInteger',
          z.number().int().lt(0),
          registrationType
        ),
      ],
      {
        SimpleInteger: {
          type: 'integer',
          maximum: 0,
          exclusiveMaximum: true,
        },
      }
    );
  });

  it('supports minimum in open api 3.1.0', () => {
    expectSchema(
      [
        registerSchema(
          'SimpleInteger',
          z.number().int().gte(0),
          registrationType
        ),
      ],
      {
        SimpleInteger: { type: 'integer', minimum: 0 },
      },
      '3.1.0'
    );
  });

  it('supports exclusive minimum in open api 3.1.0', () => {
    expectSchema(
      [
        registerSchema(
          'SimpleInteger',
          z.number().int().gt(0),
          registrationType
        ),
      ],
      {
        SimpleInteger: { type: 'integer', exclusiveMinimum: 0 },
      },
      '3.1.0'
    );
  });

  it('supports maximum in open api 3.1.0', () => {
    expectSchema(
      [
        registerSchema(
          'SimpleInteger',
          z.number().int().lte(0),
          registrationType
        ),
      ],
      {
        SimpleInteger: { type: 'integer', maximum: 0 },
      },
      '3.1.0'
    );
  });

  it('supports exclusive maximum in open api 3.1.0', () => {
    expectSchema(
      [
        registerSchema(
          'SimpleInteger',
          z.number().int().lt(0),
          registrationType
        ),
      ],
      {
        SimpleInteger: { type: 'integer', exclusiveMaximum: 0 },
      },
      '3.1.0'
    );
  });
});
