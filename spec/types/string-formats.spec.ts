import { z, ZodString } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('string formats', () => {
  it.each`
    format         | zodString           | expected
    ${'emoji'}     | ${z.emoji()}        | ${'emoji'}
    ${'cuid'}      | ${z.cuid()}         | ${'cuid'}
    ${'cuid2'}     | ${z.cuid2()}        | ${'cuid2'}
    ${'ulid'}      | ${z.ulid()}         | ${'ulid'}
    ${'uuid'}      | ${z.uuid()}         | ${'uuid'}
    ${'guid'}      | ${z.guid()}         | ${'uuid'}
    ${'email'}     | ${z.email()}        | ${'email'}
    ${'url'}       | ${z.url()}          | ${'uri'}
    ${'date'}      | ${z.date()}         | ${'date-time'}
    ${'ipv4'}      | ${z.ipv4()}         | ${'ip'}
    ${'ipv6'}      | ${z.ipv6()}         | ${'ip'}
    ${'cidrv4'}    | ${z.cidrv4()}       | ${'ipv4-cidr'}
    ${'cidrv6'}    | ${z.cidrv6()}       | ${'ipv6-cidr'}
    ${'base64url'} | ${z.base64url()}    | ${'base64url'}
    ${'datetime'}  | ${z.iso.datetime()} | ${'date-time'}
    ${'time'}      | ${z.iso.time()}     | ${'time'}
    ${'duration'}  | ${z.iso.duration()} | ${'duration'}
  `(
    'maps a ZodString $format to $expected format',
    ({ zodString, expected }: { zodString: ZodString; expected: string }) => {
      expectSchema([zodString.openapi('ZodString')], {
        ZodString: { type: 'string', format: expected },
      });
    }
  );
});
