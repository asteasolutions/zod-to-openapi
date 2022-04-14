import {
  ReferenceObject,
  SchemaObject,
  ParameterObject,
  SchemasObject,
  RequestBodyObject,
  PathItemObject,
  PathObject,
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
  ZodTypeAny,
  ZodUnion,
} from 'zod';
import {
  compact,
  flatMap,
  isNil,
  isUndefined,
  mapValues,
  omit,
  omitBy,
} from 'lodash';
import { ZodOpenAPIMetadata } from './zod-extensions';
import { RouteConfig } from './router';

// See https://github.com/colinhacks/zod/blob/9eb7eb136f3e702e86f030e6984ef20d4d8521b6/src/types.ts#L1370
type UnknownKeysParam = 'passthrough' | 'strict' | 'strip';

type OpenAPIDefinitions =
  | { type: 'schema'; schema: ZodSchema<any> }
  | { type: 'parameter'; schema: ZodSchema<any> }
  | { type: 'route'; route: RouteConfig };

export class OpenAPIGenerator {
  private schemaRefs: Record<string, SchemaObject> = {};
  private paramRefs: Record<string, ParameterObject> = {};
  private pathRefs: Record<string, Record<string, PathObject>> = {};

  constructor(private definitions: OpenAPIDefinitions[]) {}

  generate(): SchemasObject {
    this.definitions.forEach((definition) => this.generateSingle(definition));

    return {
      components: {
        schemas: this.schemaRefs,
        parameters: this.paramRefs,
      },
      paths: this.pathRefs,
    };
  }

  private generateSingle(
    definition: OpenAPIDefinitions
  ): SchemaObject | ParameterObject | ReferenceObject {
    if (definition.type === 'parameter') {
      return this.generateSingleParameter(definition.schema, true);
    }

    if (definition.type === 'schema') {
      return this.generateSingleSchema(definition.schema, true);
    }

    if (definition.type === 'route') {
      return this.generateSingleRoute(definition.route);
    }

    throw new Error('Invalid definition type');
  }

  private generateSingleParameter(
    zodSchema: ZodSchema<any>,
    saveIfNew: boolean,
    externalName?: string
  ): ParameterObject | ReferenceObject {
    const innerSchema = this.unwrapOptional(zodSchema);
    const metadata = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    const schemaName = metadata?.name ?? externalName;
    //TODO: Throw error if missing.

    if (schemaName && this.paramRefs[schemaName]) {
      return {
        $ref: `#/components/parameters/${schemaName}`,
      };
    }

    const required = !zodSchema.isOptional() && !zodSchema.isNullable();

    const schema = this.generateSingleSchema(zodSchema, false);

    const result: ParameterObject = {
      in: 'path',
      // TODO: Is this valid? I think so since parameters are only defined from registries
      name: schemaName as string,
      schema,
      // TODO: Fix types and check for possibly wrong data
      ...(metadata
        ? (this.buildMetadata(metadata) as Partial<ParameterObject>)
        : {}),
      // TODO: Is this needed
      required,
      // allowReserved: true,
    };

    if (saveIfNew && schemaName) {
      this.paramRefs[schemaName] = result;
    }

    return result;
  }

  private generateSingleSchema(
    zodSchema: ZodSchema<any>,
    saveIfNew: boolean
  ): SchemaObject | ReferenceObject {
    const innerSchema = this.unwrapOptional(zodSchema);
    const metadata = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    const schemaName = metadata?.name;

    if (schemaName && this.schemaRefs[schemaName]) {
      return {
        $ref: `#/components/schemas/${schemaName}`,
      };
    }

    const result = omitBy(
      {
        ...this.toOpenAPISchema(
          innerSchema,
          zodSchema.isNullable(),
          !!metadata?.type,
          saveIfNew
        ),
        ...(metadata ? this.buildMetadata(metadata) : {}),
      },
      isUndefined
    );

    if (saveIfNew && schemaName) {
      this.schemaRefs[schemaName] = result;
    }

    return result;
  }

  private getBodyDoc(
    bodySchema: ZodType<unknown> | undefined
  ): RequestBodyObject | undefined {
    if (!bodySchema) {
      return;
    }

    const schema = this.generateSingleSchema(bodySchema, false);

    const innerSchema = this.unwrapOptional(bodySchema);

    const metadata = bodySchema._def.openapi
      ? bodySchema._def.openapi
      : innerSchema._def.openapi;

    return {
      description: metadata?.description,
      required: true,
      content: {
        'application/json': {
          schema,
        },
      },
    };
  }

  private getParamsDoc(
    paramsSchema: ZodType<unknown> | undefined
  ): (ParameterObject | ReferenceObject)[] {
    if (!paramsSchema) {
      return [];
    }

    if (paramsSchema instanceof ZodObject) {
      const propTypes = paramsSchema._def.shape() as ZodRawShape;

      return compact(
        Object.keys(propTypes).map((name) => {
          const propSchema = propTypes[name] as ZodTypeAny | undefined;

          if (!propSchema) {
            // Should not be happening
            return undefined;
          }

          return this.generateSingleParameter(propSchema, false, name);
        })
      );
    }

    return [];
  }

  private generateSingleRoute(route: RouteConfig) {
    const responseSchema = this.generateSingleSchema(route.response, false);

    const routeDoc: PathItemObject = {
      [route.method]: {
        description: route.description,
        summary: route.summary,

        // TODO: Header parameters
        parameters: this.getParamsDoc(route.request?.params),

        requestBody: this.getBodyDoc(route.request?.body),

        responses: {
          [200]: {
            description: route.response._def.openapi?.description,
            content: {
              'application/json': {
                schema: responseSchema,
              },
            },
          },
        },
      },
    };

    this.pathRefs[route.path] = {
      ...this.pathRefs[route.path],
      ...routeDoc,
    };

    return routeDoc;
  }

  private toOpenAPISchema(
    zodSchema: ZodSchema<any>,
    isNullable: boolean,
    hasOpenAPIType: boolean,
    saveIfNew: boolean
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
      const propTypes = zodSchema._def.shape() as ZodRawShape;
      const unknownKeysOption = zodSchema._unknownKeys as UnknownKeysParam;

      return {
        type: 'object',

        properties: mapValues(propTypes, (propSchema) =>
          this.generateSingleSchema(propSchema, saveIfNew)
        ),

        required: Object.entries(propTypes)
          .filter(([_key, type]) => !type.isOptional())
          .map(([key, _type]) => key),

        additionalProperties: unknownKeysOption === 'passthrough' || undefined,

        nullable: isNullable ? true : undefined,
      };
    }

    if (zodSchema instanceof ZodBoolean) {
      return {
        type: 'boolean',
        nullable: isNullable ? true : undefined,
      };
    }

    if (zodSchema instanceof ZodArray) {
      const itemType = zodSchema._def.type as ZodSchema<any>;

      return {
        type: 'array',
        items: this.generateSingleSchema(itemType, saveIfNew),

        minItems: zodSchema._def.minLength?.value,
        maxItems: zodSchema._def.maxLength?.value,
      };
    }

    if (zodSchema instanceof ZodUnion) {
      const options = this.flattenUnionTypes(zodSchema);

      return {
        anyOf: options.map((schema) =>
          this.generateSingleSchema(schema, saveIfNew)
        ),
      };
    }

    if (zodSchema instanceof ZodIntersection) {
      const subtypes = this.flattenIntersectionTypes(zodSchema);

      return {
        allOf: subtypes.map((schema) =>
          this.generateSingleSchema(schema, saveIfNew)
        ),
      };
    }

    if (hasOpenAPIType) {
      return {};
    }

    throw new Error(
      'Unknown zod object type, please specify `type` and other OpenAPI props using `ZodSchema.openapi`'
    );
  }

  private flattenUnionTypes(schema: ZodSchema<any>): ZodSchema<any>[] {
    if (!(schema instanceof ZodUnion)) {
      return [schema];
    }

    const options = schema._def.options as ZodSchema<any>[];

    return flatMap(options, (option) => this.flattenUnionTypes(option));
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

  private buildMetadata(metadata: ZodOpenAPIMetadata): Partial<SchemaObject> {
    return omitBy(omit(metadata, 'name'), isNil);
  }

  private getName(zodSchema: ZodSchema<any>) {
    const innerSchema = this.unwrapOptional(zodSchema);
    const metadata = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    return metadata?.name;
  }
}
