import type { z } from 'zod';

type ZodTypes = {
  ZodAny: z.ZodAny;
  ZodArray: z.ZodArray<any>;
  ZodBoolean: z.ZodBoolean;
  ZodBranded: z.ZodBranded<any, any>;
  ZodDefault: z.ZodDefault<any>;
  ZodEffects: z.ZodEffects<any>;
  ZodEnum: z.ZodEnum<any>;
  ZodIntersection: z.ZodIntersection<any, any>;
  ZodLiteral: z.ZodLiteral<any>;
  ZodNativeEnum: z.ZodNativeEnum<any>;
  ZodNever: z.ZodNever;
  ZodNull: z.ZodNull;
  ZodNullable: z.ZodNullable<any>;
  ZodNumber: z.ZodNumber;
  ZodObject: z.AnyZodObject;
  ZodOptional: z.ZodOptional<any>;
  ZodPipeline: z.ZodPipeline<any, any>;
  ZodReadonly: z.ZodReadonly<any>;
  ZodRecord: z.ZodRecord;
  ZodSchema: z.ZodSchema;
  ZodString: z.ZodString;
  ZodTuple: z.ZodTuple;
  ZodType: z.ZodType;
  ZodTypeAny: z.ZodTypeAny;
  ZodUnion: z.ZodUnion<any>;
  ZodDiscriminatedUnion: z.ZodDiscriminatedUnion<any, any>;
  ZodUnknown: z.ZodUnknown;
  ZodVoid: z.ZodVoid;
  ZodDate: z.ZodDate;
};

export function isZodType<TypeName extends keyof ZodTypes>(
  schema: object,
  typeName: TypeName
): schema is ZodTypes[TypeName] {
  return (schema as any)?._def?.typeName === typeName;
}

export function isAnyZodType(schema: object): schema is z.ZodType {
  return '_def' in schema;
}
