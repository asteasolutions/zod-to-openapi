import { z, ZodString } from 'zod/v4';
import { expectSchema } from '../lib/helpers';

describe('string formats', () => {
  fit.each`
    format        | zodString                | expected
    ${'emoji'}    | ${z.string().emoji()}    | ${'emoji'}
    ${'cuid'}     | ${z.string().cuid()}     | ${'cuid'}
    ${'cuid2'}    | ${z.string().cuid2()}    | ${'cuid2'}
    ${'ulid'}     | ${z.string().ulid()}     | ${'ulid'}
    ${'uuid'}     | ${z.string().uuid()}     | ${'uuid'}
    ${'email'}    | ${z.string().email()}    | ${'email'}
    ${'url'}      | ${z.string().url()}      | ${'uri'}
    ${'date'}     | ${z.string().date()}     | ${'date'}
    ${'datetime'} | ${z.string().datetime()} | ${'date-time'}
  `(
    // ${'ip'}       | ${z.string().ip()}       | ${'ip'}
    'maps a ZodString $format to $expected format',
    ({ zodString, expected }: { zodString: ZodString; expected: string }) => {
      expectSchema([zodString.openapi('ZodString')], {
        ZodString: { type: 'string', format: expected },
      });
    }
  );
});
