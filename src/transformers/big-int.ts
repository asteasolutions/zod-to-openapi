import { MapNullableType } from '../types';

export class BigIntTransformer {
  get openApiType() {
    return 'string' as const;
  }

  transform(mapNullableType: MapNullableType) {
    return {
      ...mapNullableType(this.openApiType),
      pattern: `^\d+$`,
    };
  }
}
