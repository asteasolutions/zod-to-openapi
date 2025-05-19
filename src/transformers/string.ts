import { ZodString } from 'zod';
import { MapNullableType } from '../types';
import {
  $ZodCheck,
  $ZodCheckLengthEquals,
  $ZodCheckRegex,
  $ZodCheckStringFormat,
} from '@zod/core';

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
    // const regexCheck = this.getZodStringCheck(zodSchema, 'regex');

    const regexCheck = zodSchema.def.checks?.find(isZodCheckRegex);
    // toString generates an additional / at the beginning and end of the pattern
    const pattern = regexCheck?._zod.def.pattern
      .toString()
      .replace(/^\/|\/$/g, '');

    const check = zodSchema.def.checks?.find(isZodCheckLengthEquals);
    const length = check?._zod.def.length;
    // const length = this.getZodStringCheck(zodSchema, 'length')?.value;`

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
    // if (zodString._inputisUUID) return 'uuid';
    // if (zodString.isEmail) return 'email';
    // if (zodString.isURL) return 'uri';
    // if (zodString.isDate) return 'date';
    // if (zodString.isDatetime) return 'date-time';
    // if (zodString.isCUID) return 'cuid';
    // if (zodString.isCUID2) return 'cuid2';
    // if (zodString.isULID) return 'ulid';
    // if (zodString.isIP) return 'ip';
    // if (zodString.isEmoji) return 'emoji';

    return undefined;
  }
}
