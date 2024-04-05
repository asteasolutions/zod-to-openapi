import { MapNullableType } from '../types';

export class BigIntTransformer {
  transform(mapNullableType: MapNullableType) {
    return {
      ...mapNullableType('string'),
      pattern: `^\d+$`,
    };
  }
}
