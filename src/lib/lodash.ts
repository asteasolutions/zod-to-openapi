export function isUndefined<T>(value: any): value is undefined {
  return value === undefined;
}

export function isNil<T>(value: any): value is null | undefined {
  return value == null;
}

export function mapValues<
  T extends object,
  MapperResult,
  Result = { [K in keyof T]: MapperResult }
>(object: T, mapper: (val: T[keyof T]) => MapperResult): Result {
  const result = {} as Result;

  Object.entries(object).forEach(([key, value]: [string, T[keyof T]]) => {
    // @ts-ignore
    result[key] = mapper(value);
  });

  return result;
}

export function omit<
  T extends object,
  Keys extends keyof T,
  Result = Omit<T, Keys>
>(object: T, keys: Keys[]) {
  const result = {} as Result;

  Object.entries(object).forEach(([key, value]) => {
    if (keys.every((keyToOmit) => keyToOmit !== key)) {
      // @ts-ignore
      result[key] = value;
    }
  });

  return result;
}

export function omitBy<
  T extends object,
  Result = Partial<{ [K in keyof T]: T[keyof T] }>
>(object: T, predicate: (val: T[keyof T]) => boolean): Result {
  const result = {} as Result;

  Object.entries(object).forEach(([key, value]) => {
    if (!predicate(value)) {
      // @ts-ignore
      result[key] = value;
    }
  });

  return result;
}
