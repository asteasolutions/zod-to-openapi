import { ZodString, ZodStringDef } from 'zod';
import { MapNullableType } from '../types';

export class StringTransformer {
  transform(zodSchema: ZodString, mapNullableType: MapNullableType) {
    const regexCheck = this.getZodStringCheck(zodSchema, 'regex');

    const length = this.getZodStringCheck(zodSchema, 'length')?.value;

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
      pattern: regexCheck?.regex.source,
    };
  }

  /**
   * Attempts to map Zod strings to known formats
   * https://json-schema.org/understanding-json-schema/reference/string.html#built-in-formats
   */
  private mapStringFormat(zodString: ZodString): string | undefined {
    if (zodString.isUUID) return 'uuid';
    if (zodString.isEmail) return 'email';
    if (zodString.isURL) return 'uri';
    if (zodString.isDatetime) return 'date-time';
    if (zodString.isCUID) return 'cuid';
    if (zodString.isCUID2) return 'cuid2';
    if (zodString.isULID) return 'ulid';
    if (zodString.isIP) return 'ip';
    if (zodString.isEmoji) return 'emoji';

    return undefined;
  }

  private getZodStringCheck<T extends ZodStringDef['checks'][number]['kind']>(
    zodString: ZodString,
    kind: T
  ) {
    return zodString._def.checks.find(
      (
        check
      ): check is Extract<
        ZodStringDef['checks'][number],
        { kind: typeof kind }
      > => {
        return check.kind === kind;
      }
    );
  }
}
