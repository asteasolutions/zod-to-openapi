import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('discriminated union', () => {
  it('supports discriminated unions', () => {
    const Text = z.object({ type: z.literal('text'), text: z.string() });
    const Image = z.object({ type: z.literal('image'), src: z.string() });

    expectSchema(
      [z.discriminatedUnion('type', [Text, Image]).openapi({ refId: 'Test' })],
      {
        Test: {
          anyOf: [
            {
              type: 'object',
              required: ['type', 'text'],
              properties: {
                type: { type: 'string', enum: ['text'] },
                text: { type: 'string' },
              },
            },
            {
              type: 'object',
              required: ['type', 'src'],
              properties: {
                type: { type: 'string', enum: ['image'] },
                src: { type: 'string' },
              },
            },
          ],
        },
      }
    );
  });
});
