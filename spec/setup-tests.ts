import { z } from 'zod';
import { extendZodWithOpenApi } from '../src/zod-extensions';

console.log('Executing file');

extendZodWithOpenApi(z);
