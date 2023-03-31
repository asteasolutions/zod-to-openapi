export class ZodToOpenAPIError {
  constructor(private message: string) {}
}

interface ConflictErrorProps {
  key: string;
  values: any[];
}

export class ConflictError extends ZodToOpenAPIError {
  constructor(message: string, private data: ConflictErrorProps) {
    super(message);
  }
}
export interface MissingParameterDataErrorProps {
  paramName?: string;
  route?: string;
  location?: string;
  missingField: string;
}

export class MissingParameterDataError extends ZodToOpenAPIError {
  constructor(public data: MissingParameterDataErrorProps) {
    super(
      `Missing parameter data, please specify \`${data.missingField}\` and other OpenAPI parameter props using the \`param\` field of \`ZodSchema.openapi\``
    );
  }
}

interface UnknownZodTypeErrorProps {
  schemaName?: string;
  currentSchema: any;
}

export class UnknownZodTypeError extends ZodToOpenAPIError {
  constructor(private data: UnknownZodTypeErrorProps) {
    super(
      `Unknown zod object type, please specify \`type\` and other OpenAPI props using \`ZodSchema.openapi\`.`
    );
  }
}
