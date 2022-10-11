/**
 * Numeric enums have a reverse mapping https://www.typescriptlang.org/docs/handbook/enums.html#reverse-mappings
 * whereas string ones don't.
 *
 * This function checks if an enum is fully numeric - i.e all values are numbers or not.
 * And filters out only the actual enum values when a reverse mapping is apparent.
 */
export function extractEnumValues(enumObject: Record<string, string | number>) {
  const values = Object.values(enumObject);

  const numValues = values.filter(val => typeof val === 'number');

  if (
    numValues.length * 2 === values.length &&
    numValues.every(val => enumObject[val] !== undefined)
  ) {
    return { values: numValues, isNumeric: true };
  }

  const valuesWithoutReverseMapping = Object.entries(enumObject)
    .filter(([key, _]) => !numValues.includes(Number(key)))
    .map(([_, value]) => value.toString());

  return { values: valuesWithoutReverseMapping, isNumeric: false };
}
