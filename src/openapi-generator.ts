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
  ZodDefault,
  ZodEffects,
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
  ZodRecord,
  ZodSchema,
  ZodString,
  ZodType,
  ZodTypeAny,
  ZodUnion,
  ZodUnknown,
} from 'zod';
import { compact, isNil, mapValues, omit, omitBy } from './lib/lodash';
import { ZodOpenAPIMetadata } from './zod-extensions';
import {
  OpenAPIDefinitions,
  ResponseConfig,
  RouteConfig,
} from './openapi-registry';
import { ZodVoid } from 'zod';
import {
  ZodToOpenAPIError,
  ConflictError,
  MissingParameterDataError,
  MissingResponseDescriptionError,
  UnknownZodTypeError,
} from './errors';

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

interface ParameterData {
  in?: ParameterLocation;
  name?: string;
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

    throw new ZodToOpenAPIError('Invalid definition type');
  }

  private generateParameterDefinition(
    zodSchema: ZodSchema<any>
  ): ParameterObject | ReferenceObject {
    const metadata = this.getMetadata(zodSchema);

    const result = this.generateParameter(zodSchema);

    if (metadata?.refId) {
      this.paramRefs[metadata.refId] = result;
    }

    return result;
  }

  private getParameterRef(
    schemaMetadata: ZodOpenAPIMetadata | undefined,
    external?: ParameterData
  ): ReferenceObject | undefined {
    const parameterMetadata = schemaMetadata?.param;

    const existingRef = schemaMetadata?.refId
      ? this.paramRefs[schemaMetadata.refId]
      : undefined;

    if (!schemaMetadata?.refId || !existingRef) {
      return undefined;
    }

    if (
      (parameterMetadata && existingRef.in !== parameterMetadata.in) ||
      (external?.in && existingRef.in !== external.in)
    ) {
      throw new ConflictError(
        `Conflicting location for parameter ${existingRef.name}`,
        {
          key: 'in',
          values: compact([
            existingRef.in,
            external?.in,
            parameterMetadata?.in,
          ]),
        }
      );
    }

    if (
      (parameterMetadata && existingRef.name !== parameterMetadata.name) ||
      (external?.name && existingRef.name !== external?.name)
    ) {
      throw new ConflictError(`Conflicting names for parameter`, {
        key: 'name',
        values: compact([
          existingRef.name,
          external?.name,
          parameterMetadata?.name,
        ]),
      });
    }

    return {
      $ref: `#/components/parameters/${schemaMetadata.refId}`,
    };
  }

  private generateInlineParameters(
    zodSchema: ZodSchema<any>,
    location: ParameterLocation
  ): (ParameterObject | ReferenceObject)[] {
    const metadata = this.getMetadata(zodSchema);
    const parameterMetadata = metadata?.param;

    const referencedSchema = this.getParameterRef(metadata, { in: location });

    if (referencedSchema) {
      return [referencedSchema];
    }

    if (zodSchema instanceof ZodObject) {
      const propTypes = zodSchema._def.shape() as ZodRawShape;

      const parameters = Object.entries(propTypes).map(([key, schema]) => {
        const innerMetadata = this.getMetadata(schema);

        const referencedSchema = this.getParameterRef(innerMetadata, {
          in: location,
          name: key,
        });

        if (referencedSchema) {
          return referencedSchema;
        }

        const innerParameterMetadata = innerMetadata?.param;

        if (
          innerParameterMetadata?.name &&
          innerParameterMetadata.name !== key
        ) {
          throw new ConflictError(`Conflicting names for parameter`, {
            key: 'name',
            values: [key, innerParameterMetadata.name],
          });
        }

        if (
          innerParameterMetadata?.in &&
          innerParameterMetadata.in !== location
        ) {
          throw new ConflictError(
            `Conflicting location for parameter ${
              innerParameterMetadata.name ?? key
            }`,
            {
              key: 'in',
              values: [location, innerParameterMetadata.in],
            }
          );
        }

        return this.generateParameter(
          schema.openapi({ param: { name: key, in: location } })
        );
      });

      return parameters;
    }

    if (parameterMetadata?.in && parameterMetadata.in !== location) {
      throw new ConflictError(
        `Conflicting location for parameter ${parameterMetadata.name}`,
        {
          key: 'in',
          values: [location, parameterMetadata.in],
        }
      );
    }

    return [
      this.generateParameter(zodSchema.openapi({ param: { in: location } })),
    ];
  }

  private generateParameter(zodSchema: ZodSchema<any>): ParameterObject {
    const metadata = this.getMetadata(zodSchema);

    const paramMetadata = metadata?.param;

    const paramName = paramMetadata?.name;
    const paramLocation = paramMetadata?.in;

    if (!paramName) {
      throw new MissingParameterDataError({ missingField: 'name' });
    }

    if (!paramLocation) {
      throw new MissingParameterDataError({
        missingField: 'in',
        paramName,
      });
    }

    const required = !zodSchema.isOptional() && !zodSchema.isNullable();

    const schema = this.generateSimpleSchema(zodSchema);

    return {
      in: paramLocation,
      name: paramName,
      schema,
      required,
      ...(paramMetadata ? this.buildParameterMetadata(paramMetadata) : {}),
    };
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
      ? this.applySchemaMetadata(result, metadata)
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

    return metadata
      ? this.applySchemaMetadata(simpleSchema, metadata)
      : simpleSchema;
  }

  private generateSchemaDefinition(zodSchema: ZodSchema<any>): SchemaObject {
    const metadata = this.getMetadata(zodSchema);
    const refId = metadata?.refId;

    const simpleSchema = this.generateSimpleSchema(zodSchema);

    const result = metadata
      ? this.applySchemaMetadata(simpleSchema, metadata)
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
      required: !bodySchema.isOptional(),
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

    const parameters = this.getParameters(request);
    const requestBody = this.getRequestBody(request?.body);

    const routeDoc: PathItemObject = {
      [method]: {
        ...pathItemConfig,

        ...(parameters.length > 0 ? { parameters } : {}),

        ...(requestBody ? { requestBody } : {}),

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
        throw new MissingResponseDescriptionError();
      }

      return {
        description: metadata.description,
      };
    }

    const metadata = this.getMetadata(response.schema);
    const responseSchema = this.generateInnerSchema(response.schema);

    if (!metadata?.description) {
      throw new MissingResponseDescriptionError();
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

    if (zodSchema instanceof ZodDefault) {
      const innerSchema = zodSchema._def.innerType as ZodSchema<any>;
      return this.generateInnerSchema(innerSchema);
    }

    if (
      zodSchema instanceof ZodEffects &&
      zodSchema._def.effect.type === 'refinement'
    ) {
      const innerSchema = zodSchema._def.schema as ZodSchema<any>;
      return this.generateInnerSchema(innerSchema);
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

    if (zodSchema instanceof ZodRecord) {
      const propertiesType = zodSchema._def.valueType;

      return {
        type: 'object',
        additionalProperties: this.generateInnerSchema(propertiesType),
      };
    }

    if (zodSchema instanceof ZodUnknown || hasOpenAPIType) {
      return {};
    }

    const refId = this.getMetadata(zodSchema)?.refId;

    throw new UnknownZodTypeError({
      currentSchema: zodSchema._def,
      schemaName: refId,
    });
  }

  private isOptionalSchema(zodSchema: ZodTypeAny): boolean {
    if (zodSchema instanceof ZodEffects) {
      return this.isOptionalSchema(zodSchema._def.schema);
    }

    if (zodSchema instanceof ZodDefault) {
      return this.isOptionalSchema(zodSchema._def.innerType);
    }

    return zodSchema.isOptional();
  }

  private toOpenAPIObjectSchema(
    zodSchema: ZodObject<ZodRawShape>,
    isNullable: boolean
  ): SchemaObject {
    const propTypes = zodSchema._def.shape();
    const unknownKeysOption = zodSchema._unknownKeys as UnknownKeysParam;

    const requiredProperties = Object.entries(propTypes)
      .filter(([_key, type]) => !this.isOptionalSchema(type))
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

  private buildSchemaMetadata(metadata: ZodOpenAPIMetadata) {
    // A place to omit all custom keys added to the openapi
    return omitBy(omit(metadata, ['param', 'refId']), isNil);
  }

  private buildParameterMetadata(
    metadata: Required<ZodOpenAPIMetadata>['param']
  ) {
    return omitBy(metadata, isNil);
  }

  private getMetadata(zodSchema: ZodSchema<any>) {
    const innerSchema = this.unwrapOptional(zodSchema);
    const metadata = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    return metadata;
  }

  private applySchemaMetadata(
    initialData: SchemaObject | ParameterObject,
    metadata: Partial<ZodOpenAPIMetadata>
  ): SchemaObject | ReferenceObject {
    return omitBy(
      {
        ...initialData,
        ...this.buildSchemaMetadata(metadata),
      },
      isNil
    );
  }
}
