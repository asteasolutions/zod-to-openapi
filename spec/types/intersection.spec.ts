import { z } from 'zod/v4';
import { expectSchema } from '../lib/helpers';

describe('intersection', () => {
  it('supports intersection types', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    expectSchema([z.intersection(Person, Employee).openapi('Test')], {
      Test: {
        allOf: [
          {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name'],
          },
          {
            type: 'object',
            properties: { role: { type: 'string' } },
            required: ['role'],
          },
        ],
      },
    });
  });

  it('can automatically register intersection items', () => {
    const Person = z
      .object({
        name: z.string(),
      })
      .openapi('Person');

    const Employee = z.object({
      role: z.string(),
    });

    const schema = z.intersection(Person, Employee).openapi('Intersection');

    expectSchema([schema], {
      Person: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
        required: ['name'],
      },

      Intersection: {
        allOf: [
          { $ref: '#/components/schemas/Person' },
          {
            type: 'object',
            properties: { role: { type: 'string' } },
            required: ['role'],
          },
        ],
      },
    });
  });

  it('supports nullable intersection types', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    expectSchema(
      [z.intersection(Person, Employee).nullable().openapi('Test')],
      {
        Test: {
          anyOf: [
            {
              allOf: [
                {
                  type: 'object',
                  properties: { name: { type: 'string' } },
                  required: ['name'],
                },
                {
                  type: 'object',
                  properties: { role: { type: 'string' } },
                  required: ['role'],
                },
              ],
            },
            { nullable: true },
          ],
        },
      }
    );
  });

  it('supports default intersection types', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    expectSchema(
      [
        z
          .intersection(Person, Employee)
          .default({ name: 'hello', role: 'world' })
          .openapi('Test'),
      ],
      {
        Test: {
          allOf: [
            {
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            },
            {
              type: 'object',
              properties: { role: { type: 'string' } },
              required: ['role'],
            },
          ],
          default: {
            name: 'hello',
            role: 'world',
          },
        },
      }
    );
  });

  it('supports nullable default intersection types', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    expectSchema(
      [
        z
          .intersection(Person, Employee)
          .nullable()
          .default({ name: 'hello', role: 'world' })
          .openapi('Test'),
      ],
      {
        Test: {
          anyOf: [
            {
              allOf: [
                {
                  type: 'object',
                  properties: { name: { type: 'string' } },
                  required: ['name'],
                },
                {
                  type: 'object',
                  properties: { role: { type: 'string' } },
                  required: ['role'],
                },
              ],
            },
            { nullable: true },
          ],
          default: {
            name: 'hello',
            role: 'world',
          },
        },
      }
    );
  });
});
