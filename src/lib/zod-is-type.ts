import type { z } from 'zod';

export type ZodTypes = {
  ZodAny: z.ZodAny;
  ZodArray: z.ZodArray;
  ZodBigInt: z.ZodBigInt;
  ZodBoolean: z.ZodBoolean;
  ZodDefault: z.ZodDefault;
  ZodPrefault: z.ZodPrefault;
  ZodTransform: z.ZodTransform;
  ZodEnum: z.ZodEnum;
  ZodIntersection: z.ZodIntersection;
  ZodLazy: z.ZodLazy;
  ZodLiteral: z.ZodLiteral;
  ZodNever: z.ZodNever;
  ZodNull: z.ZodNull;
  ZodNullable: z.ZodNullable;
  ZodNumber: z.ZodNumber;
  ZodNonOptional: z.ZodNonOptional;
  ZodObject: z.ZodObject;
  ZodOptional: z.ZodOptional;
  ZodPipe: z.ZodPipe;
  ZodReadonly: z.ZodReadonly;
  ZodRecord: z.ZodRecord;
  ZodString: z.ZodString;
  ZodTuple: z.ZodTuple;
  ZodType: z.ZodType;
  ZodUnion: z.ZodUnion;
  ZodDiscriminatedUnion: z.ZodDiscriminatedUnion;
  ZodUnknown: z.ZodUnknown;
  ZodVoid: z.ZodVoid;
  ZodDate: z.ZodDate;
};

const ZodTypeKeys: Record<keyof ZodTypes, string> = {
  ZodAny: 'any',
  ZodArray: 'array',
  ZodBigInt: 'bigint',
  ZodBoolean: 'boolean',
  ZodDefault: 'default',
  ZodPrefault: 'prefault',
  ZodTransform: 'transform',
  ZodEnum: 'enum',
  ZodIntersection: 'intersection',
  ZodLazy: 'lazy',
  ZodLiteral: 'literal',
  ZodNever: 'never',
  ZodNull: 'null',
  ZodNullable: 'nullable',
  ZodNumber: 'number',
  ZodNonOptional: 'nonoptional',
  ZodObject: 'object',
  ZodOptional: 'optional',
  ZodPipe: 'pipe',
  ZodReadonly: 'readonly',
  ZodRecord: 'record',
  ZodString: 'string',
  ZodTuple: 'tuple',
  ZodType: 'type',
  ZodUnion: 'union',
  ZodDiscriminatedUnion: 'union',
  ZodUnknown: 'unknown',
  ZodVoid: 'void',
  ZodDate: 'date',
};

export function isZodType<TypeName extends keyof ZodTypes>(
  schema: object,
  typeNames: TypeName[]
): schema is ZodTypes[TypeName];
export function isZodType<TypeName extends keyof ZodTypes>(
  schema: object,
  typeName: TypeName
): schema is ZodTypes[TypeName];
export function isZodType<TypeName extends keyof ZodTypes>(
  schema: object,
  typeNames: TypeName | TypeName[]
): schema is ZodTypes[TypeName] {
  const typeNamesArray = Array.isArray(typeNames) ? typeNames : [typeNames];

  return typeNamesArray.some(typeName => {
    const typeNameMatch =
      (schema as z.ZodType)?.def?.type === ZodTypeKeys[typeName];

    if (typeName === 'ZodDiscriminatedUnion') {
      return (
        typeNameMatch &&
        'discriminator' in (schema as z.ZodDiscriminatedUnion).def
      );
    }

    return typeNameMatch;
  });
}

export function isAnyZodType(schema: object): schema is z.ZodType {
  return 'def' in schema;
}

/**
 * The schema.isNullable() is deprecated. This is the suggested replacement
 * as this was how isNullable operated beforehand.
 */
export function isNullableSchema(schema: z.ZodType) {
  return schema.safeParse(null).success;
}

/**
 * The schema.isOptional() is deprecated. This is the suggested replacement
 * as this was how isOptional operated beforehand.
 */
export function isOptionalSchema(schema: z.ZodType) {
  return schema.safeParse(undefined).success;
}
