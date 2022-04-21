import {
  ReferenceObject,
  SchemaObject,
  ParameterObject,
  RequestBodyObject,
  PathItemObject,
  PathObject,
  OpenAPIObject,
  InfoObject,
  ServerObject,
  SecurityRequirementObject,
  TagObject,
  ExternalDocumentationObject,
  ComponentsObject,
  ParameterLocation,
  ResponseObject,
} from 'openapi3-ts';
import {
  ZodArray,
  ZodBoolean,
  ZodEnum,
  ZodIntersection,
  ZodLiteral,
  ZodNativeEnum,
  ZodNull,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodRawShape,
  ZodSchema,
  ZodString,
  ZodType,
  ZodUnion,
} from 'zod';
import { isNil, mapValues, omit, omitBy } from './lib/lodash';
import {
  ZodOpenAPIMetadata,
  ZodOpenAPIParameterMetadata,
} from './zod-extensions';
import {
  OpenAPIDefinitions,
  ResponseConfig,
  RouteConfig,
} from './openapi-registry';
import { ZodVoid } from 'zod';

// See https://github.com/colinhacks/zod/blob/9eb7eb136f3e702e86f030e6984ef20d4d8521b6/src/types.ts#L1370
type UnknownKeysParam = 'passthrough' | 'strict' | 'strip';

// This is essentially OpenAPIObject without the components and paths keys.
// Omit does not work, since OpenAPIObject extends ISpecificationExtension
// and is inferred as { [key: number]: any; [key: string]: any }
interface OpenAPIObjectConfig {
  openapi: string;
  info: InfoObject;
  servers?: ServerObject[];
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
}

export class OpenAPIGenerator {
  private schemaRefs: Record<string, SchemaObject> = {};
  private paramRefs: Record<string, ParameterObject> = {};
  private pathRefs: Record<string, Record<string, PathObject>> = {};

  constructor(private definitions: OpenAPIDefinitions[]) {
    this.sortDefinitions();
  }

  generateDocument(config: OpenAPIObjectConfig): OpenAPIObject {
    this.definitions.forEach((definition) => this.generateSingle(definition));

    return {
      ...config,
      components: {
        schemas: this.schemaRefs,
        parameters: this.paramRefs,
      },
      paths: this.pathRefs,
    };
  }

  generateComponents(): ComponentsObject {
    this.definitions.forEach((definition) => this.generateSingle(definition));

    return {
      components: {
        schemas: this.schemaRefs,
        parameters: this.paramRefs,
      },
    };
  }

  private sortDefinitions() {
    const generationOrder: OpenAPIDefinitions['type'][] = [
      'schema',
      'parameter',
      'route',
    ];

    this.definitions.sort((left, right) => {
      const leftIndex = generationOrder.findIndex((type) => type === left.type);
      const rightIndex = generationOrder.findIndex(
        (type) => type === right.type
      );

      return leftIndex - rightIndex;
    });
  }

  private generateSingle(
    definition: OpenAPIDefinitions
  ): SchemaObject | ParameterObject | ReferenceObject {
    if (definition.type === 'parameter') {
      return this.generateParameterDefinition(definition.schema);
    }

    if (definition.type === 'schema') {
      return this.generateSchemaDefinition(definition.schema);
    }

    if (definition.type === 'route') {
      return this.generateSingleRoute(definition.route);
    }

    throw new Error('Invalid definition type');
  }

  private generateParameterDefinition(
    zodSchema: ZodSchema<any>
  ): ParameterObject | ReferenceObject {
    const metadata = this.getMetadata(
      zodSchema
    ) as Partial<ZodOpenAPIParameterMetadata>;

    const result = this.generateParameter(zodSchema);

    if (metadata?.refId) {
      this.paramRefs[metadata.refId] = result;
    }

    return result;
  }

  private generateInlineParameters(
    zodSchema: ZodSchema<any>,
    location: ParameterLocation
  ): (ParameterObject | ReferenceObject)[] {
    const metadata = this.getMetadata(
      zodSchema
    ) as Partial<ZodOpenAPIParameterMetadata>;
    const existingRef = metadata?.refId
      ? this.paramRefs[metadata.refId]
      : undefined;

    if (existingRef) {
      if (existingRef.in !== location) {
        throw new Error(
          `The parameter ${existingRef.name} was created with \`in: ${existingRef.in}\` but was used as ${location} parameter`
        );
      }

      return [
        {
          $ref: `#/components/parameters/${metadata.refId}`,
        },
      ];
    }

    if (zodSchema instanceof ZodObject) {
      const propTypes = zodSchema._def.shape() as ZodRawShape;

      const parameters = Object.entries(propTypes).map(([key, schema]) => {
        const innerMetadata = this.getMetadata(schema);

        if (innerMetadata?.name && innerMetadata.name !== key) {
          throw new Error(
            `Conflicting name - a parameter was created with the key "${key}" in ${location} but has a name "${innerMetadata.name}" defined with \`.openapi()\`. Please use only one.`
          );
        }

        if (innerMetadata?.in && innerMetadata.in !== location) {
          throw new Error(
            `Conflicting location - the parameter "${innerMetadata.name}" was created within "${location}" but has a in: "${innerMetadata.in}" property defined with \`.openapi()\`. Please use only one.`
          );
        }

        return this.generateParameter(
          schema.openapi({ name: key, in: location })
        );
      });

      return parameters;
    }

    if (metadata?.in && metadata.in !== location) {
      throw new Error(
        `Conflicting location - the parameter "${metadata.name}" was created within "${location}" but has a in: "${metadata.in}" property defined with \`.openapi()\`. Please use only one.`
      );
    }

    return [this.generateParameter(zodSchema.openapi({ in: location }))];
  }

  private generateParameter(zodSchema: ZodSchema<any>): ParameterObject {
    const metadata = this.getMetadata(
      zodSchema
    ) as Partial<ZodOpenAPIParameterMetadata>;

    const paramName = metadata?.name;
    const paramLocation = metadata?.in;

    if (!paramName) {
      throw new Error(
        'Missing parameter name, please specify `name` and other OpenAPI props using `ZodSchema.openapi`'
      );
    }

    // TODO: Might add custom errors.
    if (!paramLocation) {
      throw new Error(
        `Missing parameter location for parameter ${paramName}, please specify \`in\` and other OpenAPI props using \`ZodSchema.openapi\``
      );
    }

    const required = !zodSchema.isOptional() && !zodSchema.isNullable();

    const schema = this.generatePlainSchema(zodSchema);

    return {
      in: paramLocation,
      name: paramName,
      schema,
      required,
      ...(metadata ? this.buildMetadata(metadata) : {}),
    };
  }

  /**
   * Generates an OpenAPI SchemaObject or a ReferenceObject without applying
   * the metadata provided. i.e it generates a ref or a simple type
   */
  private generatePlainSchema(
    zodSchema: ZodSchema<any>
  ): SchemaObject | ReferenceObject {
    const innerSchema = this.unwrapOptional(zodSchema);
    const metadata = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    const refId = metadata?.refId;

    if (refId && this.schemaRefs[refId]) {
      return {
        $ref: `#/components/schemas/${refId}`,
      };
    }

    return omitBy(
      this.toOpenAPISchema(
        innerSchema,
        zodSchema.isNullable(),
        !!metadata?.type
      ),
      isNil
    );
  }

  /**
   * Generates an OpenAPI SchemaObject or a ReferenceObject with all the provided metadata applied
   */
  private generateSimpleSchema(
    zodSchema: ZodSchema<any>
  ): SchemaObject | ReferenceObject {
    const innerSchema = this.unwrapOptional(zodSchema);
    const metadata = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    const refId = metadata?.refId;

    if (refId && this.schemaRefs[refId]) {
      return {
        $ref: `#/components/schemas/${refId}`,
      };
    }

    const result = this.toOpenAPISchema(
      innerSchema,
      zodSchema.isNullable(),
      !!metadata?.type
    );

    return metadata
      ? this.applyMetadata(result, metadata)
      : omitBy(result, isNil);
  }

  private generateInnerSchema(
    zodSchema: ZodSchema<any>,
    metadata?: ZodOpenAPIMetadata
  ): SchemaObject | ReferenceObject {
    const simpleSchema = this.generateSimpleSchema(zodSchema);

    if (simpleSchema.$ref) {
      return simpleSchema;
    }

    return metadata ? this.applyMetadata(simpleSchema, metadata) : simpleSchema;
  }

  private generateSchemaDefinition(zodSchema: ZodSchema<any>): SchemaObject {
    const metadata = this.getMetadata(zodSchema);
    const refId = metadata?.refId;

    const simpleSchema = this.generateSimpleSchema(zodSchema);

    const result = metadata
      ? this.applyMetadata(simpleSchema, metadata)
      : simpleSchema;

    if (refId) {
      this.schemaRefs[refId] = result;
    }

    return result;
  }

  private getRequestBody(
    bodySchema: ZodType<unknown> | undefined
  ): RequestBodyObject | undefined {
    if (!bodySchema) {
      return;
    }

    const schema = this.generateInnerSchema(bodySchema);
    const metadata = this.getMetadata(bodySchema);

    return {
      description: metadata?.description,
      required: true,
      content: {
        // TODO: Maybe should be coming from metadata
        'application/json': {
          schema,
        },
      },
    };
  }

  private getParameters(
    request: RouteConfig['request'] | undefined
  ): (ParameterObject | ReferenceObject)[] {
    if (!request) {
      return [];
    }

    const queryParameters = request.query
      ? this.generateInlineParameters(request.query, 'query')
      : [];

    const pathParameters = request.params
      ? this.generateInlineParameters(request.params, 'path')
      : [];

    const headerParameters =
      request.headers?.flatMap((header) =>
        this.generateInlineParameters(header, 'header')
      ) ?? [];

    return [...pathParameters, ...queryParameters, ...headerParameters];
  }

  private generateSingleRoute(route: RouteConfig) {
    const { method, path, request, responses, ...pathItemConfig } = route;

    const generatedResponses = mapValues(responses, (response) => {
      return this.getResponse(response);
    });

    const routeDoc: PathItemObject = {
      [method]: {
        ...pathItemConfig,

        parameters: this.getParameters(request),

        requestBody: this.getRequestBody(request?.body),

        responses: generatedResponses,
      },
    };

    this.pathRefs[path] = {
      ...this.pathRefs[path],
      ...routeDoc,
    };

    return routeDoc;
  }

  private getResponse(
    response: ResponseConfig
  ): ResponseObject | ReferenceObject {
    if (response instanceof ZodVoid) {
      const metadata = this.getMetadata(response);

      if (!metadata?.description) {
        throw new Error(
          'Missing response description. Please specify `description` and using `ZodSchema.openapi`.'
        );
      }

      return {
        description: metadata.description,
      };
    }

    const metadata = this.getMetadata(response.schema);
    const responseSchema = this.generateInnerSchema(response.schema);

    if (!metadata?.description) {
      throw new Error(
        'Missing response description. Please specify `description` and using `ZodSchema.openapi`.'
      );
    }

    return {
      description: metadata.description,
      content: {
        [response.mediaType]: {
          schema: responseSchema,
        },
      },
    };
  }

  private toOpenAPISchema(
    zodSchema: ZodSchema<any>,
    isNullable: boolean,
    hasOpenAPIType: boolean
  ): SchemaObject {
    if (zodSchema instanceof ZodNull) {
      return { type: 'null' };
    }

    if (zodSchema instanceof ZodString) {
      return {
        type: 'string',
        nullable: isNullable ? true : undefined,
      };
    }

    if (zodSchema instanceof ZodNumber) {
      return {
        type: 'number',
        minimum: zodSchema.minValue ?? undefined,
        maximum: zodSchema.maxValue ?? undefined,
        nullable: isNullable ? true : undefined,
      };
    }

    if (zodSchema instanceof ZodBoolean) {
      return {
        type: 'boolean',
        nullable: isNullable ? true : undefined,
      };
    }

    if (zodSchema instanceof ZodLiteral) {
      return {
        type: typeof zodSchema._def.value as SchemaObject['type'],
        nullable: isNullable ? true : undefined,
        enum: [zodSchema._def.value],
      };
    }

    if (zodSchema instanceof ZodEnum) {
      // ZodEnum only accepts strings
      return {
        type: 'string',
        nullable: isNullable ? true : undefined,
        enum: zodSchema._def.values,
      };
    }

    if (zodSchema instanceof ZodNativeEnum) {
      const enumValues = Object.values(zodSchema._def.values);

      // ZodNativeEnum can accepts number values for enum but in odd format
      // Not worth it for now so using plain string
      return {
        type: 'string',
        nullable: isNullable ? true : undefined,
        enum: enumValues,
      };
    }

    if (zodSchema instanceof ZodObject) {
      return this.toOpenAPIObjectSchema(zodSchema, isNullable);
    }

    if (zodSchema instanceof ZodArray) {
      const itemType = zodSchema._def.type as ZodSchema<any>;

      return {
        type: 'array',
        items: this.generateInnerSchema(itemType),

        minItems: zodSchema._def.minLength?.value,
        maxItems: zodSchema._def.maxLength?.value,
      };
    }

    if (zodSchema instanceof ZodUnion) {
      const options = this.flattenUnionTypes(zodSchema);

      return {
        anyOf: options.map((schema) => this.generateInnerSchema(schema)),
      };
    }

    if (zodSchema instanceof ZodIntersection) {
      const subtypes = this.flattenIntersectionTypes(zodSchema);

      return {
        allOf: subtypes.map((schema) => this.generateInnerSchema(schema)),
      };
    }

    if (hasOpenAPIType) {
      return {};
    }

    const refId = this.getMetadata(zodSchema)?.refId;
    const errorFor = refId ? ` for ${refId}` : '';

    throw new Error(
      `Unknown zod object type${errorFor}, please specify \`type\` and other OpenAPI props using \`ZodSchema.openapi\`. The current schema is: ` +
        JSON.stringify(zodSchema._def)
    );
  }

  private toOpenAPIObjectSchema(
    zodSchema: ZodObject<ZodRawShape>,
    isNullable: boolean
  ): SchemaObject {
    const propTypes = zodSchema._def.shape();
    const unknownKeysOption = zodSchema._unknownKeys as UnknownKeysParam;

    const requiredProperties = Object.entries(propTypes)
      .filter(([_key, type]) => !type.isOptional())
      .map(([key, _type]) => key);

    return {
      type: 'object',

      properties: mapValues(propTypes, (propSchema) =>
        this.generateInnerSchema(propSchema)
      ),

      required: requiredProperties.length > 0 ? requiredProperties : undefined,

      additionalProperties: unknownKeysOption === 'passthrough' || undefined,

      nullable: isNullable ? true : undefined,
    };
  }

  private flattenUnionTypes(schema: ZodSchema<any>): ZodSchema<any>[] {
    if (!(schema instanceof ZodUnion)) {
      return [schema];
    }

    const options = schema._def.options as ZodSchema<any>[];

    return options.flatMap((option) => this.flattenUnionTypes(option));
  }

  private flattenIntersectionTypes(schema: ZodSchema<any>): ZodSchema<any>[] {
    if (!(schema instanceof ZodIntersection)) {
      return [schema];
    }

    const leftSubTypes = this.flattenIntersectionTypes(schema._def.left);
    const rightSubTypes = this.flattenIntersectionTypes(schema._def.right);

    return [...leftSubTypes, ...rightSubTypes];
  }

  private unwrapOptional(schema: ZodSchema<any>): ZodSchema<any> {
    while (schema instanceof ZodOptional || schema instanceof ZodNullable) {
      schema = schema.unwrap();
    }

    return schema;
  }

  // The open api metadata can come in any format - ParameterObject/SchemaObject.
  // We leave it up to the user to define it and take care of it.
  private buildMetadata(metadata: Partial<ZodOpenAPIMetadata>) {
    // A place to omit all custom keys added to the openapi
    return omitBy(omit(metadata, ['name', 'refId']), isNil);
  }

  private getMetadata(zodSchema: ZodSchema<any>) {
    const innerSchema = this.unwrapOptional(zodSchema);
    const metadata = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    return metadata;
  }

  private applyMetadata(
    initialData: SchemaObject | ParameterObject,
    metadata: Partial<ZodOpenAPIMetadata>
  ): SchemaObject | ReferenceObject {
    return omitBy(
      {
        ...initialData,
        ...this.buildMetadata(metadata),
      },
      isNil
    );
  }
}
