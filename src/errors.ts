export class BaseError {
  constructor(private message: string, private data?: unknown) {}
}

interface ConflictErrorProps {
  key: string;
  values: any[];
}

export class ConflictError extends BaseError {
  constructor(message: string, data: ConflictErrorProps) {
    super(message, data);
  }
}

export class MissingInformationError extends BaseError {
  constructor(message: string) {
    super(message);
  }
}

interface MissingParameterDataErrorProps {
  paramName?: string;
  missingField: string;
}

export class MissingParameterDataError extends BaseError {
  constructor(data: MissingParameterDataErrorProps) {
    super(
      `Missing parameter data, please specify \`${data.missingField}\` and other OpenAPI parameter props using the \`param\` field of \`ZodSchema.openapi\``,
      data
    );
  }
}

export class MissingResponseDescriptionError extends BaseError {
  constructor() {
    super(
      'Missing response description. Please specify `description` and using `ZodSchema.openapi`.'
    );
  }
}

interface UnknownZodTypeErrorProps {
  schemaName?: string;
  currentSchema: any;
}

export class UnknownZodTypeError extends BaseError {
  constructor({ schemaName, currentSchema }: UnknownZodTypeErrorProps) {
    const errorFor = schemaName ? ` for ${schemaName}` : '';

    super(
      `Unknown zod object type${errorFor}, please specify \`type\` and other OpenAPI props using \`ZodSchema.openapi\`.`,
      currentSchema
    );
  }
}
