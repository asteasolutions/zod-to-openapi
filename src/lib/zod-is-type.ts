import type { z } from 'zod';

type ZodTypes = {
  ZodArray: z.ZodArray<any>;
  ZodBoolean: z.ZodBoolean;
  ZodDefault: z.ZodDefault<any>;
  ZodEffects: z.ZodEffects<any>;
  ZodEnum: z.ZodEnum<any>;
  ZodIntersection: z.ZodIntersection<any, any>;
  ZodLiteral: z.ZodLiteral<any>;
  ZodNativeEnum: z.ZodNativeEnum<any>;
  ZodNull: z.ZodNull;
  ZodNullable: z.ZodNullable<any>;
  ZodNumber: z.ZodNumber;
  ZodObject: z.ZodObject<any>;
  ZodOptional: z.ZodOptional<any>;
  ZodRecord: z.ZodRecord;
  ZodSchema: z.ZodSchema;
  ZodString: z.ZodString;
  ZodType: z.ZodType;
  ZodTypeAny: z.ZodTypeAny;
  ZodUnion: z.ZodUnion<any>;
  ZodDiscriminatedUnion: z.ZodDiscriminatedUnion<any, any, any>;
  ZodUnknown: z.ZodUnknown;
  ZodVoid: z.ZodVoid;
};

export function isZodType<TypeName extends keyof ZodTypes>(
  schema: object,
  typeName: TypeName
): schema is ZodTypes[TypeName] {
  return schema.constructor.name === typeName;
}
