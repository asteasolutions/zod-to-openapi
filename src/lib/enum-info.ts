/**
 * Numeric enums have a reverse mapping https://www.typescriptlang.org/docs/handbook/enums.html#reverse-mappings
 * whereas string ones don't.
 *
 * This function checks if an enum is fully numeric - i.e all values are numbers or not.
 * And filters out only the actual enum values when a reverse mapping is apparent.
 */
export function enumInfo(enumObject: Record<string, string | number>) {
  const keysExceptReverseMappings = Object.keys(enumObject).filter(
    key => typeof enumObject[enumObject[key] as any] !== 'number'
  );

  const values = keysExceptReverseMappings.map(key => enumObject[key]);
  const numericCount = values.filter(_ => typeof _ === 'number').length;

  const type =
    numericCount === 0
      ? ('string' as const)
      : numericCount === values.length
      ? ('numeric' as const)
      : ('mixed' as const);

  return { values: values, type };
}
