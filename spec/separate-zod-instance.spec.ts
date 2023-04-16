import { extendZodWithOpenApi } from '../src/zod-extensions';
import {
  expectSchema,
  registerSchema,
  registrationTypeDescribe,
} from './lib/helpers';

/**
 * See https://github.com/asteasolutions/zod-to-openapi/issues/17
 */
registrationTypeDescribe('Separate Zod instance', registrationType => {
  function requireSeparateZodInstance() {
    jest.resetModules();
    delete require.cache[require.resolve('zod')];

    return require('zod');
  }

  const zod1 = requireSeparateZodInstance();
  extendZodWithOpenApi(zod1);

  const zod2 = requireSeparateZodInstance();
  extendZodWithOpenApi(zod2);

  it('can check object types of different zod instances', () => {
    expectSchema(
      [registerSchema('SimpleString', zod1.string(), registrationType)],
      {
        SimpleString: { type: 'string' },
      }
    );

    expectSchema(
      [registerSchema('SimpleString', zod2.string(), registrationType)],
      {
        SimpleString: { type: 'string' },
      }
    );
  });
});
