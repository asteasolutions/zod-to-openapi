import { extendZodWithOpenApi } from '../src/zod-extensions';
import { expectSchema } from './lib/helpers';

// Schemas constructed before `extendZodWithOpenApi` runs must still expose a
// working `.openapi`. Zod v4 binds prototype keys to instances at construction
// time and does not link `ZodObject.prototype` (etc.) to `ZodType.prototype`,
// so a late patch on `ZodType.prototype` alone is unreachable from
// pre-existing instances.
describe('Late extendZodWithOpenApi', () => {
  function requireSeparateZodInstance() {
    jest.resetModules();
    delete require.cache[require.resolve('zod')];

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('zod');
  }

  const zod = requireSeparateZodInstance();

  const stringBefore = zod.z.string();
  const numberBefore = zod.z.number();
  const objectBefore = zod.z.object({ a: zod.z.string() });
  const arrayBefore = zod.z.array(zod.z.string());
  const tupleBefore = zod.z.tuple([zod.z.string(), zod.z.number()]);
  const unionBefore = zod.z.union([zod.z.string(), zod.z.number()]);
  const optionalBefore = zod.z.string().optional();
  const nullableBefore = zod.z.number().nullable();

  extendZodWithOpenApi(zod);

  it('attaches .openapi to primitives constructed before the call', () => {
    expect(typeof stringBefore.openapi).toBe('function');
    expect(typeof numberBefore.openapi).toBe('function');
  });

  it('attaches .openapi to composites constructed before the call', () => {
    expect(typeof objectBefore.openapi).toBe('function');
    expect(typeof arrayBefore.openapi).toBe('function');
    expect(typeof tupleBefore.openapi).toBe('function');
    expect(typeof unionBefore.openapi).toBe('function');
  });

  it('attaches .openapi to wrappers constructed before the call', () => {
    expect(typeof optionalBefore.openapi).toBe('function');
    expect(typeof nullableBefore.openapi).toBe('function');
  });

  it('keeps .openapi working for schemas constructed after the call', () => {
    const after = zod.z.string();
    const afterOptional = zod.z.string().optional();
    const afterArray = zod.z.array(zod.z.number());
    expect(typeof after.openapi).toBe('function');
    expect(typeof afterOptional.openapi).toBe('function');
    expect(typeof afterArray.openapi).toBe('function');
  });

  it('produces a usable spec from a pre-existing primitive', () => {
    expectSchema([stringBefore.openapi('SimpleString')], {
      SimpleString: { type: 'string' },
    });
  });

  it('produces a usable spec from a pre-existing composite', () => {
    expectSchema([objectBefore.openapi('SimpleObject')], {
      SimpleObject: {
        type: 'object',
        properties: { a: { type: 'string' } },
        required: ['a'],
      },
    });
  });

  it('does not attach .openapi to ZodError', () => {
    // ZodError is exported by zod but is not a schema constructor — it
    // extends Error and has no `_def`. Polluting its prototype with
    // `.openapi` would change observable behavior in `try { ... } catch (e)`
    // blocks and would crash with an inscrutable error if anyone called it.
    expect(typeof zod.ZodError.prototype.openapi).toBe('undefined');
  });
});
