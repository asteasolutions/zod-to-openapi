import { OpenApiGeneratorV31 } from './v3.1/openapi-generator';
import { extendZodWithOpenApi } from './zod-extensions';
import { z } from 'zod';

extendZodWithOpenApi(z);

const UserSchema = z
  .object({
    id: z.string().openapi({ example: '1212121' }),
    name: z.string().openapi({ example: 'John Doe' }),
    age: z.number().openapi({ example: 42 }),
  })
  .openapi('User', {
    description: "User's data",
  });

const generator = new OpenApiGeneratorV31([UserSchema]);

const openapi = generator.generateComponents();

console.log(JSON.stringify(openapi, null, 2));
