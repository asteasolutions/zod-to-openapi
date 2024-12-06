import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('custom', () => {
  it('generates OpenAPI schema for custom type', () => {
    const FileSchema = z
      .custom(target => target instanceof File)
      .openapi({
        type: 'string',
        format: 'binary',
      })
      .openapi('File');

    expectSchema([FileSchema], {
      File: {
        type: 'string',
        format: 'binary',
      },
    });
  });

  it('generates OpenAPI schema for custom type in object', () => {
    const FileUploadSchema = z
      .object({
        file: z
          .custom(target => target instanceof File)
          .openapi({
            type: 'string',
            format: 'binary',
          }),
      })
      .openapi('FileUpload');

    expectSchema([FileUploadSchema], {
      FileUpload: {
        type: 'object',
        properties: {
          file: { type: 'string', format: 'binary' },
        },
        required: ['file'],
      },
    });
  });
});
