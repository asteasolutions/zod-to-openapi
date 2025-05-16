import { EnumLike, ZodNativeEnum } from 'zod';
import { ZodToOpenAPIError } from '../errors';
import { enumInfo } from '../lib/enum-info';
import { MapNullableType } from '../types';

export class NativeEnumTransformer {
  transform<T extends EnumLike>(
    zodSchema: ZodNativeEnum<T>,
    mapNullableType: MapNullableType
  ) {
    const { type, values } = enumInfo(zodSchema.def.values);

    if (type === 'mixed') {
      // enum Test {
      //   A = 42,
      //   B = 'test',
      // }
      //
      // const result = z.nativeEnum(Test).parse('42');
      //
      // This is an error, so we can't just say it's a 'string'
      throw new ZodToOpenAPIError(
        'Enum has mixed string and number values, please specify the OpenAPI type manually'
      );
    }

    return {
      ...mapNullableType(type === 'numeric' ? 'integer' : 'string'),
      enum: values,
    };
  }
}
