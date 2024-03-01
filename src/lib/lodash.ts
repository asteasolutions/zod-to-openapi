import { isEqual, ObjectSet } from './object-set';

export function isUndefined<T>(value: any): value is undefined {
  return value === undefined;
}

export function isNil<T>(value: any): value is null | undefined {
  return value === null || value === undefined;
}

export function mapValues<
  T extends object,
  MapperResult,
  Result = { [K in keyof T]: MapperResult }
>(object: T, mapper: (val: T[keyof T]) => MapperResult): Result {
  const result: any = {};

  Object.entries(object).forEach(([key, value]) => {
    result[key] = mapper(value);
  });

  return result;
}

export function omit<
  T extends object,
  Keys extends keyof T,
  Result = Omit<T, Keys>
>(object: T, keys: Keys[]): Result {
  const result: any = {};

  Object.entries(object).forEach(([key, value]) => {
    if (!keys.some(keyToOmit => keyToOmit === key)) {
      result[key] = value;
    }
  });

  return result;
}

export function omitBy<
  T extends object,
  Result = Partial<{ [K in keyof T]: T[keyof T] }>
>(object: T, predicate: (val: T[keyof T], key: keyof T) => boolean): Result {
  const result: any = {};

  Object.entries(object).forEach(([key, value]) => {
    if (!predicate(value, key as keyof T)) {
      result[key] = value;
    }
  });

  return result;
}

export function compact<T extends any>(arr: (T | null | undefined)[]) {
  return arr.filter((elem): elem is T => !isNil(elem));
}

export const objectEquals = isEqual;

export function uniq<T>(values: T[]) {
  const set = new ObjectSet<T>();

  values.forEach(value => set.put(value));

  return [...set.values()];
}

export function isString(val: unknown): val is string {
  return typeof val === 'string';
}
