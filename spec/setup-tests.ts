import { z } from 'zod/v4';
import { extendZodWithOpenApi } from '../src/zod-extensions';

extendZodWithOpenApi(z);
