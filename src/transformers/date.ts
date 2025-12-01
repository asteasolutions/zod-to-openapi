import { MapNullableType } from '../types';

export class DateTransformer {
  transform(mapNullableType: MapNullableType) {
    return {
      ...mapNullableType('string'),
      format: 'date-time',
    };
  }
}
