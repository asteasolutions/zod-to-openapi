import { MapNullableType } from '../types';

export class DateTransformer {
  get openApiType() {
    return 'string' as const;
  }

  transform(mapNullableType: MapNullableType) {
    return {
      ...mapNullableType(this.openApiType),
      format: 'date',
    };
  }
}
