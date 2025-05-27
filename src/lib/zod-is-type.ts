import type { z } from 'zod/v4';

export type ZodTypes = {
  ZodAny: z.ZodAny;
  ZodArray: z.ZodArray;
  ZodBigInt: z.ZodBigInt;
  ZodBoolean: z.ZodBoolean;
  ZodDefault: z.ZodDefault;
  ZodTransform: z.ZodTransform;
  ZodEnum: z.ZodEnum;
  ZodIntersection: z.ZodIntersection;
  ZodLiteral: z.ZodLiteral;
  ZodNever: z.ZodNever;
  ZodNull: z.ZodNull;
  ZodNullable: z.ZodNullable;
  ZodNumber: z.ZodNumber;
  ZodObject: z.ZodObject;
  ZodOptional: z.ZodOptional;
  ZodPipe: z.ZodPipe;
  ZodReadonly: z.ZodReadonly;
  ZodRecord: z.ZodRecord;
  ZodSchema: z.ZodSchema;
  ZodString: z.ZodString;
  ZodTuple: z.ZodTuple;
  ZodType: z.ZodType;
  ZodTypeAny: z.ZodTypeAny;
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
  ZodTransform: 'transform',
  ZodEnum: 'enum',
  ZodIntersection: 'intersection',
  ZodLiteral: 'literal',
  ZodNever: 'never',
  ZodNull: 'null',
  ZodNullable: 'nullable',
  ZodNumber: 'number',
  ZodObject: 'object',
  ZodOptional: 'optional',
  ZodPipe: 'pipe',
  ZodReadonly: 'readonly',
  ZodRecord: 'record',
  ZodSchema: 'schema',
  ZodString: 'string',
  ZodTuple: 'tuple',
  ZodType: 'type',
  ZodTypeAny: 'typeAny',
  ZodUnion: 'union',
  ZodDiscriminatedUnion: 'union',
  ZodUnknown: 'unknown',
  ZodVoid: 'void',
  ZodDate: 'date',
};

export function isZodType<TypeName extends keyof ZodTypes>(
  schema: object,
  typeName: TypeName
): schema is ZodTypes[TypeName] {
  const typeNameMatch =
    (schema as z.ZodType)?.def?.type === ZodTypeKeys[typeName];

  if (typeName === 'ZodDiscriminatedUnion') {
    return (
      typeNameMatch &&
      'discriminator' in (schema as z.ZodDiscriminatedUnion).def
    );
  }

  return typeNameMatch;
}

export function isAnyZodType(schema: object): schema is z.ZodType {
  return 'def' in schema;
}
