import { extendZodWithOpenApi } from './zod-extensions';
import { z } from 'zod';

extendZodWithOpenApi(z);

const Text = z
  .object({ type: z.literal('text'), text: z.string() })
  .openapi('obj1');
const Image = z
  .object({ type: z.literal('image'), src: z.string() })
  .openapi('obj2');

const schema = z.discriminatedUnion('type', [Text, Image]).openapi('Test');

console.log(schema.def);
