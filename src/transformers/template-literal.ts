import { ZodTemplateLiteral } from 'zod';
import { isZodType } from '../lib/zod-is-type';
import { MapNullableType } from '../types';
import { enumInfo } from '../lib/enum-info';

export class TemplateLiteralTransformer {
  transform(zodSchema: ZodTemplateLiteral, mapNullableType: MapNullableType) {
    const parts = zodSchema.def.parts;
    const contentPattern = parts
      .map(part => this.generatePattern(part))
      .join('');

    return {
      ...mapNullableType('string'),
      pattern: `^${contentPattern}$`,
    };
  }

  private generatePattern(part: ZodTemplateLiteral['def']['parts'][number]) {
    if (
      typeof part === 'string' ||
      typeof part === 'number' ||
      typeof part === 'boolean' ||
      typeof part === 'bigint' ||
      part === null ||
      part === undefined
    ) {
      return this.escapeRegex(String(part));
    }

    if (isZodType(part, 'ZodLiteral')) {
      const value = part.def.values[0];
      return this.escapeRegex(String(value));
    }

    if (isZodType(part, 'ZodNumber')) {
      return '[+-]?\\d+(\\.\\d+)?';
    }
    if (isZodType(part, 'ZodBoolean')) {
      return '(true|false)';
    }
    if (isZodType(part, 'ZodEnum')) {
      const { values } = enumInfo(part.def.entries);
      return `(${values.map(v => this.escapeRegex(String(v))).join('|')})`;
    }

    return '.*';
  }

  private escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
