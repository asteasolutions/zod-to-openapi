import { z, ZodString } from 'zod/v4';
import { expectSchema } from '../lib/helpers';

describe('string formats', () => {
  fit.each`
    format        | zodString           | expected
    ${'emoji'}    | ${z.emoji()}        | ${'emoji'}
    ${'cuid'}     | ${z.cuid()}         | ${'cuid'}
    ${'cuid2'}    | ${z.cuid2()}        | ${'cuid2'}
    ${'ulid'}     | ${z.ulid()}         | ${'ulid'}
    ${'uuid'}     | ${z.uuid()}         | ${'uuid'}
    ${'email'}    | ${z.email()}        | ${'email'}
    ${'url'}      | ${z.url()}          | ${'uri'}
    ${'date'}     | ${z.date()}         | ${'date'}
    ${'ipv4'}     | ${z.ipv4()}         | ${'ip'}
    ${'ipv6'}     | ${z.ipv6()}         | ${'ip'}
    ${'datetime'} | ${z.iso.datetime()} | ${'date-time'}
  `(
    'maps a ZodString $format to $expected format',
    ({ zodString, expected }: { zodString: ZodString; expected: string }) => {
      expectSchema([zodString.openapi('ZodString')], {
        ZodString: { type: 'string', format: expected },
      });
    }
  );
});
