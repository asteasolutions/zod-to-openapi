import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('json', () => {
  it('supports z.json() in openapi 3.0.0', () => {
    const schema = z.json().openapi('Json', { description: 'A JSON schema' });

    expectSchema(
      [schema],
      {
        Json: {
          anyOf: [
            { type: 'string' },
            { type: 'number' },
            { type: 'boolean' },
            { type: 'string', nullable: true, enum: [null] },
            {
              type: 'array',
              items: {
                anyOf: [
                  { $ref: '#/components/schemas/Json' },
                  { type: 'string', nullable: true, enum: [null] },
                ],
              },
            },
            {
              type: 'object',
              additionalProperties: {
                anyOf: [
                  { $ref: '#/components/schemas/Json' },
                  { type: 'string', nullable: true, enum: [null] },
                ],
              },
            },
          ],
          description: 'A JSON schema',
        },
      },
      { version: '3.0.0' }
    );
  });

  it('supports z.json() in openapi 3.1.0', () => {
    const schema = z.json().openapi('Json', { description: 'A JSON schema' });

    expectSchema(
      [schema],
      {
        Json: {
          anyOf: [
            { type: 'string' },
            { type: 'number' },
            { type: 'boolean' },
            { type: 'null' },
            {
              type: 'array',
              items: {
                oneOf: [
                  { $ref: '#/components/schemas/Json' },
                  { type: 'null' },
                ],
              },
            },
            {
              type: 'object',
              additionalProperties: {
                oneOf: [
                  { $ref: '#/components/schemas/Json' },
                  { type: 'null' },
                ],
              },
            },
          ],
          description: 'A JSON schema',
        },
      },
      { version: '3.1.0' }
    );
  });
});
