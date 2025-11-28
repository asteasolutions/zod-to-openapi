import { ZodString } from 'zod';
import { MapNullableType } from '../types';
import {
  $ZodCheck,
  $ZodCheckLengthEquals,
  $ZodCheckRegex,
  $ZodCheckStringFormat,
} from 'zod/core';

function isZodCheckLengthEquals(
  check: $ZodCheck<string>
): check is $ZodCheckLengthEquals {
  return check._zod.def.check === 'length_equals';
}

function isZodCheckRegex(check: $ZodCheck<string>): check is $ZodCheckRegex {
  return (
    check._zod.def.check === 'string_format' &&
    (check as $ZodCheckStringFormat)._zod.def.format === 'regex'
  );
}

export class StringTransformer {
  transform(zodSchema: ZodString, mapNullableType: MapNullableType) {
    const regexCheck = zodSchema.def.checks?.find(isZodCheckRegex);
    // toString generates an additional / at the beginning and end of the pattern
    const pattern = regexCheck?._zod.def.pattern
      .toString()
      .replace(/^\/|\/$/g, '');

    const check = zodSchema.def.checks?.find(isZodCheckLengthEquals);
    const length = check?._zod.def.length;

    const maxLength = Number.isFinite(zodSchema.minLength)
      ? zodSchema.minLength ?? undefined
      : undefined;

    const minLength = Number.isFinite(zodSchema.maxLength)
      ? zodSchema.maxLength ?? undefined
      : undefined;

    return {
      ...mapNullableType('string'),
      // FIXME: https://github.com/colinhacks/zod/commit/d78047e9f44596a96d637abb0ce209cd2732d88c
      minLength: length ?? maxLength,
      maxLength: length ?? minLength,
      format: this.mapStringFormat(zodSchema),
      pattern,
    };
  }

  /**
   * Attempts to map Zod strings to known formats
   * https://json-schema.org/understanding-json-schema/reference/string.html#built-in-formats
   */
  private mapStringFormat(zodString: ZodString): string | undefined {
    if (zodString.format === 'guid') return 'guid';
    if (zodString.format === 'uuid') return 'uuid';
    if (zodString.format === 'email') return 'email';
    if (zodString.format === 'url') return 'uri';
    if (zodString.format === 'date') return 'date';
    if (zodString.format === 'datetime') return 'date-time';
    if (zodString.format === 'cuid') return 'cuid';
    if (zodString.format === 'cuid2') return 'cuid2';
    if (zodString.format === 'ulid') return 'ulid';
    if (zodString.format === 'ipv4') return 'ip';
    if (zodString.format === 'ipv6') return 'ip';
    if (zodString.format === 'emoji') return 'emoji';

    return undefined;
  }
}
