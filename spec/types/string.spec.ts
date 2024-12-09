import { z, ZodString } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('string', () => {
  it('generates OpenAPI schema for simple types', () => {
    expectSchema([z.string().openapi('SimpleString')], {
      SimpleString: { type: 'string' },
    });
  });

  it('supports exact length on string', () => {
    expectSchema([z.string().length(5).openapi('minMaxLengthString')], {
      minMaxLengthString: { type: 'string', minLength: 5, maxLength: 5 },
    });
  });

  it('supports minLength / maxLength on string', () => {
    expectSchema([z.string().min(5).max(10).openapi('minMaxLengthString')], {
      minMaxLengthString: { type: 'string', minLength: 5, maxLength: 10 },
    });
  });

  it('supports the combination of min/max + length on string', () => {
    expectSchema(
      [
        z.string().length(5).min(6).openapi('minAndLengthString'),
        z.string().max(10).length(5).openapi('maxAndLengthString'),
      ],
      {
        minAndLengthString: { type: 'string', minLength: 5, maxLength: 5 },
        maxAndLengthString: { type: 'string', minLength: 5, maxLength: 5 },
      }
    );
  });

  it('supports string literals', () => {
    expectSchema([z.literal('John Doe').openapi('Literal')], {
      Literal: { type: 'string', enum: ['John Doe'] },
    });
  });

  fit.each`
    format        | zodString                | expected
    ${'emoji'}    | ${z.string().emoji()}    | ${'emoji'}
    ${'cuid'}     | ${z.string().cuid()}     | ${'cuid'}
    ${'cuid2'}    | ${z.string().cuid2()}    | ${'cuid2'}
    ${'ulid'}     | ${z.string().ulid()}     | ${'ulid'}
    ${'ip'}       | ${z.string().ip()}       | ${'ip'}
    ${'uuid'}     | ${z.string().uuid()}     | ${'uuid'}
    ${'email'}    | ${z.string().email()}    | ${'email'}
    ${'url'}      | ${z.string().url()}      | ${'uri'}
    ${'date'}     | ${z.string().date()}     | ${'date'}
    ${'datetime'} | ${z.string().datetime()} | ${'date-time'}
    ${'duration'} | ${z.string().duration()} | ${'duration'}
    ${'time'}     | ${z.string().time()}     | ${'time'}
  `(
    'maps a ZodString $format to $expected format',
    ({ zodString, expected }: { zodString: ZodString; expected: string }) => {
      expectSchema([zodString.openapi('ZodString')], {
        ZodString: { type: 'string', format: expected },
      });
    }
  );

  it('maps a ZodString regex to a pattern', () => {
    expectSchema(
      [
        z
          .string()
          .regex(/^hello world/)
          .openapi('RegexString'),
      ],
      {
        RegexString: { type: 'string', pattern: '^hello world' },
      }
    );
  });
});
