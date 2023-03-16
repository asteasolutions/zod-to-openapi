export function isEqual(x: any, y: any): boolean {
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
    keysX.every(key => isEqual(x[key], y[key]))
  );
}

export class ObjectSet<V> {
  private buckets = new Map<number, V[]>();
  put(value: V) {
    const hashCode = this.hashCodeOf(value);
    const itemsByCode = this.buckets.get(hashCode);
    if (!itemsByCode) {
      this.buckets.set(hashCode, [value]);
      return;
    }
    const alreadyHasItem = itemsByCode.some(_ => isEqual(_, value));
    if (!alreadyHasItem) {
      itemsByCode.push(value);
    }
  }

  contains(value: V): boolean {
    const hashCode = this.hashCodeOf(value);
    const itemsByCode = this.buckets.get(hashCode);
    if (!itemsByCode) {
      return false;
    }
    return itemsByCode.some(_ => isEqual(_, value));
  }

  values() {
    return [...this.buckets.values()].flat();
  }

  stats() {
    let totalBuckets = 0;
    let totalValues = 0;
    let collisions = 0;
    for (const bucket of this.buckets.values()) {
      totalBuckets += 1;
      totalValues += bucket.length;
      if (bucket.length > 1) {
        collisions += 1;
      }
    }
    const hashEffectiveness = totalBuckets / totalValues;
    return { totalBuckets, collisions, totalValues, hashEffectiveness };
  }
  private hashCodeOf(object: any): number {
    let hashCode = 0;
    if (Array.isArray(object)) {
      for (let i = 0; i < object.length; i++) {
        hashCode ^= this.hashCodeOf(object[i]) * i;
      }
    } else if (typeof object === 'string') {
      for (let i = 0; i < object.length; i++) {
        hashCode ^= object.charCodeAt(i) * i;
      }
    } else if (typeof object === 'number') {
      return object;
    } else if (typeof object === 'object') {
      for (const key of Object.keys(object)) {
        hashCode ^=
          this.hashCodeOf(key) + this.hashCodeOf((object as any)[key] ?? '');
      }
    }
    return hashCode;
  }
}
