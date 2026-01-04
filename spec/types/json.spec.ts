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
            { nullable: true },
            {
              type: 'array',
              items: {
                allOf: [
                  { $ref: '#/components/schemas/Json' },
                  { nullable: true },
                ],
              },
            },
            {
              type: 'object',
              additionalProperties: {
                allOf: [
                  { $ref: '#/components/schemas/Json' },
                  { nullable: true },
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
