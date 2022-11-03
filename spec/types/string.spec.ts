import { z, ZodString } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('string', () => {
  it('generates OpenAPI schema for simple types', () => {
    expectSchema([registerSchema('SimpleString', z.string())], {
      SimpleString: { type: 'string' },
    });
  });

  it('supports string literals', () => {
    expectSchema([registerSchema('Literal', z.literal('John Doe'))], {
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
      expectSchema([registerSchema('ZodString', zodString)], {
        ZodString: { type: 'string', format: expected },
      });
    }
  );

  it('maps a ZodString regex to a pattern', () => {
    expectSchema(
      [registerSchema('RegexString', z.string().regex(/^hello world/))],
      {
        RegexString: { type: 'string', pattern: '^hello world' },
      }
    );
  });
});
