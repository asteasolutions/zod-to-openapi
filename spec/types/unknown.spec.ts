import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

it('supports unknown', () => {
  expectSchema(
    [
      z
        .unknown()
        .openapi({ refId: 'Unknown', description: 'Something unknown' }),
    ],
    {
      Unknown: { description: 'Something unknown' },
    }
  );
});
