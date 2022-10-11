import { z, ZodString } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('string', () => {
  it('generates OpenAPI schema for simple types', () => {
    expectSchema([z.string().openapi({ refId: 'SimpleString' })], {
      SimpleString: { type: 'string' },
    });
  });

  it('supports string literals', () => {
    expectSchema([z.literal('John Doe').openapi({ refId: 'Literal' })], {
      Literal: { type: 'string', enum: ['John Doe'] },
    });
  });

  it.each`
    format     | zodString             | expected
    ${'uuid'}  | ${z.string().uuid()}  | ${'uuid'}
    ${'email'} | ${z.string().email()} | ${'email'}
    ${'url'}   | ${z.string().url()}   | ${'uri'}
  `(
    'maps a ZodString $format to $expected format',
    ({ zodString, expected }: { zodString: ZodString; expected: string }) => {
      expectSchema([zodString.openapi({ refId: 'ZodString' })], {
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
          .openapi({ refId: 'RegexString' }),
      ],
      {
        RegexString: { type: 'string', pattern: '^hello world' },
      }
    );
  });
});
