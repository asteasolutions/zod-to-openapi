import { extendZodWithOpenApi } from '../src/zod-extensions';
import { expectSchema } from './lib/helpers';

/**
 * See https://github.com/asteasolutions/zod-to-openapi/issues/17
 */
describe('Separate Zod instance', () => {
  function requireSeparateZodInstance() {
    jest.resetModules();
    delete require.cache[require.resolve('zod/v4')];

    return require('zod/v4');
  }

  const zod1 = requireSeparateZodInstance();
  extendZodWithOpenApi(zod1);

  const zod2 = requireSeparateZodInstance();
  extendZodWithOpenApi(zod2);

  it('can check object types of different zod instances', () => {
    expectSchema([zod1.string().openapi('SimpleString')], {
      SimpleString: { type: 'string' },
    });

    expectSchema([zod2.string().openapi('SimpleString')], {
      SimpleString: { type: 'string' },
    });
  });
});
