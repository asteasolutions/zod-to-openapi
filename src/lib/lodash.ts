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

export function objectEquals(x: any, y: any): boolean {
  if (x === null || x === undefined || y === null || y === undefined) {
    return x === y;
  }

  if (x === y || x.valueOf() === y.valueOf()) {
    return true;
  }

  if (Array.isArray(x)) {
    if (!Array.isArray(y)) {
      return false;
    }

    if (x.length !== y.length) {
      return false;
    }
  }

  // if they are strictly equal, they both need to be object at least
  if (!(x instanceof Object) || !(y instanceof Object)) {
    return false;
  }

  // recursive object equality check
  const keysX = Object.keys(x);
  return (
    Object.keys(y).every(keyY => keysX.indexOf(keyY) !== -1) &&
    keysX.every(key => objectEquals(x[key], y[key]))
  );
}
