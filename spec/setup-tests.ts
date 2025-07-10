import { z } from 'zod';
import { extendZodWithOpenApi } from '../src/zod-extensions';

extendZodWithOpenApi(z);
