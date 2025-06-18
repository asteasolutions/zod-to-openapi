import {
  OpenApiGeneratorV31,
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from '../src';
import { z } from 'zod/v4';
import * as fs from 'fs';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

describe('Recursive schemas', () => {
  it('can register and generate recursive schemas', () => {
    const registry = new OpenAPIRegistry();

    // Example 1: Simple recursive category tree
    const CategoryBaseSchema = z.object({
      id: z.string().openapi({ example: 'cat-123' }),
      name: z.string().openapi({ example: 'Electronics' }),
      description: z
        .string()
        .optional()
        .openapi({ example: 'Electronic devices and accessories' }),
    });

    // Define the type first
    type CategoryType = z.infer<typeof CategoryBaseSchema> & {
      subcategories?: CategoryType[];
      parent?: CategoryType;
    };

    const CategorySchema = CategoryBaseSchema.extend({
      get subcategories(): z.ZodOptional<z.ZodArray<z.ZodType<CategoryType>>> {
        return z.array(CategorySchema).optional();
      },
      get parent(): z.ZodOptional<z.ZodType<CategoryType>> {
        return CategorySchema.optional();
      },
    }).openapi({
      ref: 'Category',
      description: 'A product category that can contain subcategories',
    });

    // Example 2: Mutually recursive User and Post
    const UserBaseSchema = z.object({
      id: z.string().openapi({ example: 'user-456' }),
      username: z.string().openapi({ example: 'johndoe' }),
      email: z.email().openapi({ example: 'john@example.com' }),
    });

    const PostBaseSchema = z.object({
      id: z.string().openapi({ example: 'post-789' }),
      title: z.string().openapi({ example: 'My First Post' }),
      content: z
        .string()
        .openapi({ example: 'This is the content of my post...' }),
      createdAt: z.iso.datetime().openapi({ example: '2023-12-07T10:30:00Z' }),
    });

    const CommentBaseSchema = z.object({
      id: z.string().openapi({ example: 'comment-101' }),
      content: z
        .string()
        .openapi({ example: 'Great post! Thanks for sharing.' }),
      createdAt: z.iso.datetime().openapi({ example: '2023-12-07T11:00:00Z' }),
    });

    // Define types first
    type UserType = z.infer<typeof UserBaseSchema> & {
      posts?: PostType[];
    };

    type PostType = z.infer<typeof PostBaseSchema> & {
      author: UserType;
      comments?: CommentType[];
    };

    type CommentType = z.infer<typeof CommentBaseSchema> & {
      author: UserType;
      replies?: CommentType[];
      parent?: CommentType;
    };

    const UserSchema = UserBaseSchema.extend({
      get posts(): z.ZodOptional<z.ZodArray<z.ZodType<PostType>>> {
        return z.array(PostSchema).optional();
      },
    }).openapi({
      ref: 'User',
      description: 'A user who can create posts',
    });

    const PostSchema = PostBaseSchema.extend({
      get author(): z.ZodType<UserType> {
        return UserSchema;
      },
      get comments(): z.ZodOptional<z.ZodArray<z.ZodType<CommentType>>> {
        return z.array(CommentSchema).optional();
      },
    }).openapi({
      ref: 'Post',
      description: 'A blog post created by a user',
    });

    const CommentSchema = CommentBaseSchema.extend({
      get author(): z.ZodType<UserType> {
        return UserSchema;
      },
      get replies(): z.ZodOptional<z.ZodArray<z.ZodType<CommentType>>> {
        return z.array(CommentSchema).optional();
      },
      get parent(): z.ZodOptional<z.ZodType<CommentType>> {
        return CommentSchema.optional();
      },
    }).openapi({
      ref: 'Comment',
      description: 'A comment that can have nested replies',
    });

    // Example 4: Complex nested menu structure
    const MenuItemBaseSchema = z.object({
      id: z.string().openapi({ example: 'menu-item-1' }),
      label: z.string().openapi({ example: 'Home' }),
      url: z.string().url().optional().openapi({ example: '/home' }),
      icon: z.string().optional().openapi({ example: 'home-icon' }),
      order: z.number().int().openapi({ example: 1 }),
    });

    type MenuItemType = z.infer<typeof MenuItemBaseSchema> & {
      submenu?: {
        items: MenuItemType[];
        featured?: MenuItemType;
        config?: {
          showIcons: boolean;
          maxDepth: number;
        };
      };
    };

    const MenuItemSchema = MenuItemBaseSchema.extend({
      get submenu(): z.ZodOptional<
        z.ZodType<{
          items: MenuItemType[];
          featured?: MenuItemType;
          config?: {
            showIcons: boolean;
            maxDepth: number;
          };
        }>
      > {
        return z
          .object({
            items: z.array(MenuItemSchema),
            featured: MenuItemSchema.optional(),
            config: z
              .object({
                showIcons: z.boolean().default(true),
                maxDepth: z.number().int().default(3),
              })
              .optional(),
          })
          .optional();
      },
    }).openapi({
      ref: 'MenuItem',
      description: 'A menu item that can contain nested submenus',
    });

    // Example 5: Organization hierarchy
    const OrganizationBaseSchema = z.object({
      id: z.string().openapi({ example: 'org-555' }),
      name: z.string().openapi({ example: 'Engineering Department' }),
      type: z
        .enum(['company', 'department', 'team'])
        .openapi({ example: 'department' }),
    });

    type OrganizationType = z.infer<typeof OrganizationBaseSchema> & {
      parent?: OrganizationType;
      children?: OrganizationType[];
      manager?: UserType;
      employees?: UserType[];
    };

    const OrganizationSchema = OrganizationBaseSchema.extend({
      get parent(): z.ZodOptional<z.ZodType<OrganizationType>> {
        return OrganizationSchema.optional();
      },
      get children(): z.ZodOptional<z.ZodArray<z.ZodType<OrganizationType>>> {
        return z.array(OrganizationSchema).optional();
      },
      get manager(): z.ZodOptional<z.ZodType<UserType>> {
        return UserSchema.optional();
      },
      get employees(): z.ZodOptional<z.ZodArray<z.ZodType<UserType>>> {
        return z.array(UserSchema).optional();
      },
    }).openapi({
      ref: 'Organization',
      description:
        'An organizational unit that can have parent and child units',
    });

    // Register all schemas
    registry.register('Category', CategorySchema);
    registry.register('User', UserSchema);
    registry.register('Post', PostSchema);
    registry.register('Comment', CommentSchema);
    registry.register('MenuItem', MenuItemSchema);
    registry.register('Organization', OrganizationSchema);

    // Register API endpoints

    // Categories endpoints
    registry.registerPath({
      method: 'get',
      path: '/categories',
      description: 'Get all categories',
      summary: 'Retrieve a list of product categories with their subcategories',
      tags: ['Categories'],
      responses: {
        200: {
          description: 'List of categories',
          content: {
            'application/json': {
              schema: z.array(CategorySchema),
            },
          },
        },
      },
    });

    registry.registerPath({
      method: 'post',
      path: '/categories',
      description: 'Create a new category',
      summary: 'Create a new product category',
      tags: ['Categories'],
      request: {
        body: {
          description: 'Category data',
          content: {
            'application/json': {
              schema: CategoryBaseSchema.omit({ id: true }),
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Category created successfully',
          content: {
            'application/json': {
              schema: CategorySchema,
            },
          },
        },
        400: {
          description: 'Invalid category data',
        },
      },
    });

    registry.registerPath({
      method: 'get',
      path: '/categories/{id}',
      description: 'Get category by ID',
      summary: 'Retrieve a specific category with its subcategories and parent',
      tags: ['Categories'],
      request: {
        params: z.object({
          id: z.string().openapi({
            param: {
              name: 'id',
              in: 'path',
            },
            example: 'cat-123',
          }),
        }),
      },
      responses: {
        200: {
          description: 'Category details',
          content: {
            'application/json': {
              schema: CategorySchema,
            },
          },
        },
        404: {
          description: 'Category not found',
        },
      },
    });

    // Users endpoints
    registry.registerPath({
      method: 'get',
      path: '/users/{id}',
      description: 'Get user by ID',
      summary: 'Retrieve a user with their posts',
      tags: ['Users'],
      request: {
        params: z.object({
          id: z.string().openapi({
            param: {
              name: 'id',
              in: 'path',
            },
            example: 'user-456',
          }),
        }),
      },
      responses: {
        200: {
          description: 'User details',
          content: {
            'application/json': {
              schema: UserSchema,
            },
          },
        },
        404: {
          description: 'User not found',
        },
      },
    });

    // Posts endpoints
    registry.registerPath({
      method: 'get',
      path: '/posts/{id}',
      description: 'Get post by ID',
      summary: 'Retrieve a post with author and comments',
      tags: ['Posts'],
      request: {
        params: z.object({
          id: z.string().openapi({
            param: {
              name: 'id',
              in: 'path',
            },
            example: 'post-789',
          }),
        }),
      },
      responses: {
        200: {
          description: 'Post details',
          content: {
            'application/json': {
              schema: PostSchema,
            },
          },
        },
        404: {
          description: 'Post not found',
        },
      },
    });

    // Comments endpoints
    registry.registerPath({
      method: 'post',
      path: '/posts/{id}/comments',
      description: 'Add comment to post',
      summary: 'Add a new comment to a post',
      tags: ['Comments'],
      request: {
        params: z.object({
          id: z.string().openapi({
            param: {
              name: 'id',
              in: 'path',
            },
            example: 'post-789',
          }),
        }),
        body: {
          description: 'Comment data',
          content: {
            'application/json': {
              schema: CommentBaseSchema.omit({ id: true, createdAt: true }),
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Comment added successfully',
          content: {
            'application/json': {
              schema: CommentSchema,
            },
          },
        },
        400: {
          description: 'Invalid comment data',
        },
        404: {
          description: 'Post not found',
        },
      },
    });

    // Menu endpoints
    registry.registerPath({
      method: 'get',
      path: '/menu',
      description: 'Get navigation menu',
      summary: 'Retrieve the complete navigation menu structure',
      tags: ['Menu'],
      responses: {
        200: {
          description: 'Navigation menu',
          content: {
            'application/json': {
              schema: z.array(MenuItemSchema),
            },
          },
        },
      },
    });

    // Organization endpoints
    registry.registerPath({
      method: 'get',
      path: '/organizations/{id}/hierarchy',
      description: 'Get organization hierarchy',
      summary:
        'Retrieve an organization with its parent and child organizations',
      tags: ['Organizations'],
      request: {
        params: z.object({
          id: z.string().openapi({
            param: {
              name: 'id',
              in: 'path',
            },
            example: 'org-555',
          }),
        }),
      },
      responses: {
        200: {
          description: 'Organization hierarchy',
          content: {
            'application/json': {
              schema: OrganizationSchema,
            },
          },
        },
        404: {
          description: 'Organization not found',
        },
      },
    });

    // Generate OpenAPI JSON
    const generator = new OpenApiGeneratorV31(registry.definitions);

    const docs = generator.generateDocument({
      openapi: '3.1.0',
      info: {
        version: '1.0.0',
        title: 'Recursive Types API',
        description:
          'An API demonstrating various recursive data structures using Zod and OpenAPI',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
      },
      servers: [
        {
          url: 'https://api.example.com/v1',
          description: 'Production server',
        },
        {
          url: 'http://localhost:3000/v1',
          description: 'Development server',
        },
      ],
      tags: [
        {
          name: 'Categories',
          description: 'Product category management',
        },
        {
          name: 'Users',
          description: 'User management',
        },
        {
          name: 'Posts',
          description: 'Blog post management',
        },
        {
          name: 'Comments',
          description: 'Comment management',
        },
        {
          name: 'Menu',
          description: 'Navigation menu',
        },
        {
          name: 'Organizations',
          description: 'Organization hierarchy',
        },
      ],
    });

    expect(docs).toMatchSnapshot();

    // Uncomment this to Write to file
    // fs.writeFileSync(
    //   'recursive-openapi-generated.json',
    //   JSON.stringify(docs, null, 2)
    // );
  });
});
