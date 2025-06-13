import { expectSchema } from '../lib/helpers';
import { z } from 'zod/v4';

describe('meta', () => {
  it('should preserve metadata through the meta modifier', () => {
    const schema = z
      .string()
      .meta({
        description: 'Some description',
        deprecated: true,
        example: 'test',
      })
      .openapi('SomeString');

    expectSchema([schema], {
      SomeString: {
        type: 'string',
        description: 'Some description',
        deprecated: true,
        example: 'test',
      },
    });
  });

  it('should override metadata when calling .openapi', () => {
    const schema = z
      .string()
      .meta({
        description: 'Some description',
        deprecated: true,
        example: 'test',
      })
      .openapi('SomeString', {
        description: 'Some description override',
        example: 'test override',
      });

    expectSchema([schema], {
      SomeString: {
        type: 'string',
        description: 'Some description override',
        deprecated: true,
        example: 'test override',
      },
    });
  });

  it('should override metadata when calling .meta', () => {
    const schema = z
      .string()
      .openapi('SomeString', {
        description: 'Some description',
        deprecated: true,
        example: 'test',
      })
      .meta({
        description: 'Some description override',
        example: 'test override',
      });

    expectSchema([schema], {
      SomeString: {
        type: 'string',
        description: 'Some description override',
        deprecated: true,
        example: 'test override',
      },
    });
  });
  it('should register schema when given an id in .meta', () => {
    const schema = z.string().meta({ id: 'SomeString' });

    expectSchema([schema], {
      SomeString: { type: 'string' },
    });
  });

  it('should use the refId from .openapi as priority over the one in .meta', () => {
    const schema = z
      .string()
      .meta({ id: 'MetaString' })
      .openapi('SomeOpenApiString');

    expectSchema([schema], {
      SomeOpenApiString: { type: 'string' },
    });
  });
});
