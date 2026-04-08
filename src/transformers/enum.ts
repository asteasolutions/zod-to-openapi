import { ZodEnum } from 'zod';
import { MapNullableType } from '../types';
import { enumInfo } from '../lib/enum-info';
import { ZodToOpenAPIError } from '../errors';

export class EnumTransformer {
  transform(
    zodSchema: ZodEnum,
    isNullable: boolean,
    mapNullableType: MapNullableType
  ) {
    const { type, values } = enumInfo(zodSchema._zod.def.entries);

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
      enum: isNullable ? [...values, null] : values,
    };
  }
}
