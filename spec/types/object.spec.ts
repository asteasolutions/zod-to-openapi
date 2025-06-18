import { z } from 'zod/v4';
import { expectSchema } from '../lib/helpers';

describe('object', () => {
  it('generates OpenAPI schema for nested objects', () => {
    expectSchema(
      [
        z
          .object({
            test: z.object({
              id: z.string().openapi({ description: 'The entity id' }),
            }),
          })
          .openapi('NestedObject'),
      ],
      {
        NestedObject: {
          type: 'object',
          required: ['test'],
          properties: {
            test: {
              type: 'object',
              required: ['id'],
              properties: {
                id: { type: 'string', description: 'The entity id' },
              },
            },
          },
        },
      }
    );
  });

  it('creates separate schemas and links them', () => {
    const SimpleStringSchema = z.string().openapi('SimpleString');

    const ObjectWithStringsSchema = z
      .object({
        str1: SimpleStringSchema.optional(),
        str2: SimpleStringSchema,
      })
      .openapi('ObjectWithStrings');

    expectSchema([SimpleStringSchema, ObjectWithStringsSchema], {
      SimpleString: { type: 'string' },
      ObjectWithStrings: {
        type: 'object',
        properties: {
          str1: { $ref: '#/components/schemas/SimpleString' },
          str2: { $ref: '#/components/schemas/SimpleString' },
        },
        required: ['str2'],
      },
    });
  });

  it('maps additionalProperties to false for strict objects', () => {
    expectSchema(
      [
        z
          .strictObject({
            test: z.string(),
          })
          .openapi('StrictObject'),
      ],
      {
        StrictObject: {
          type: 'object',
          required: ['test'],
          additionalProperties: false,
          properties: {
            test: {
              type: 'string',
            },
          },
        },
      }
    );
  });

  it('can automatically register object properties', () => {
    const schema = z
      .object({ key: z.string().openapi('Test') })
      .openapi('Object');

    expectSchema([schema], {
      Test: {
        type: 'string',
      },

      Object: {
        type: 'object',
        properties: {
          key: {
            $ref: '#/components/schemas/Test',
          },
        },
        required: ['key'],
      },
    });
  });

  it('can automatically register extended parent properties', () => {
    const schema = z.object({ id: z.number().openapi('NumberId') });

    const extended = schema
      .extend({
        name: z.string().openapi('Name'),
      })
      .openapi('ExtendedObject');

    expectSchema([extended], {
      Name: {
        type: 'string',
      },

      NumberId: {
        type: 'number',
      },

      ExtendedObject: {
        type: 'object',
        properties: {
          id: {
            $ref: '#/components/schemas/NumberId',
          },
          name: {
            $ref: '#/components/schemas/Name',
          },
        },
        required: ['id', 'name'],
      },
    });
  });

  it('can automatically register extended schemas', () => {
    const schema = z
      .object({ id: z.string().openapi('StringId') })
      .openapi('Object');

    const extended = schema
      .extend({
        id: z.number().openapi('NumberId'),
      })
      .openapi('ExtendedObject');

    expectSchema([extended], {
      StringId: {
        type: 'string',
      },

      NumberId: {
        type: 'number',
      },

      Object: {
        type: 'object',
        properties: {
          id: {
            $ref: '#/components/schemas/StringId',
          },
        },
        required: ['id'],
      },

      ExtendedObject: {
        allOf: [
          { $ref: '#/components/schemas/Object' },
          {
            type: 'object',
            properties: {
              id: { $ref: '#/components/schemas/NumberId' },
            },
          },
        ],
      },
    });
  });
  it('generates OpenAPI schema for recursive objects', () => {
    const Category = z
      .object({
        name: z.string(),
        get subcategories() {
          return z.array(Category);
        },
      })
      .openapi({
        description: 'A category with subcategories',
        ref: 'category',
      });

    expectSchema([Category], {
      category: {
        type: 'object',
        description: 'A category with subcategories',
        required: ['name', 'subcategories'],
        properties: {
          name: { type: 'string' },
          subcategories: {
            type: 'array',
            items: { $ref: '#/components/schemas/category' },
          },
        },
      },
    });
  });

  it('generates OpenAPI schema for mutually recursive objects', () => {
    const User = z
      .object({
        id: z.string(),
        name: z.string(),
        get posts() {
          return z.array(Post);
        },
      })
      .openapi({
        ref: 'User',
      });

    const Post = z
      .object({
        id: z.string(),
        title: z.string(),
        get author() {
          return User;
        },
      })
      .openapi({
        ref: 'Post',
      });

    expectSchema([User, Post], {
      User: {
        type: 'object',
        required: ['id', 'name', 'posts'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          posts: {
            type: 'array',
            items: { $ref: '#/components/schemas/Post' },
          },
        },
      },
      Post: {
        type: 'object',
        required: ['id', 'title', 'author'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          author: { $ref: '#/components/schemas/User' },
        },
      },
    });
  });

  it('generates OpenAPI schema for recursive objects with optional properties', () => {
    const Node = z
      .object({
        value: z.string(),
        get children() {
          return z.array(Node).optional();
        },
        get parent() {
          return Node.optional();
        },
      })
      .openapi({
        ref: 'Node',
        description: 'A tree node that can reference itself',
      });

    expectSchema([Node], {
      Node: {
        type: 'object',
        description: 'A tree node that can reference itself',
        required: ['value'],
        properties: {
          value: { type: 'string' },
          children: {
            type: 'array',
            items: { $ref: '#/components/schemas/Node' },
          },
          parent: { $ref: '#/components/schemas/Node' },
        },
      },
    });
  });

  it('generates OpenAPI schema for deeply nested recursive objects', () => {
    const Menu = z
      .object({
        id: z.string(),
        title: z.string(),
        get submenu() {
          return z.object({
            items: z.array(Menu),
            get featured() {
              return Menu.optional();
            },
          });
        },
      })
      .openapi({
        ref: 'Menu',
      });

    expectSchema([Menu], {
      Menu: {
        type: 'object',
        required: ['id', 'title', 'submenu'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          submenu: {
            type: 'object',
            required: ['items'],
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/Menu' },
              },
              featured: { $ref: '#/components/schemas/Menu' },
            },
          },
        },
      },
    });
  });
});
