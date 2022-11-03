import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('intersection', () => {
  it.concurrent('supports intersection types', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    expectSchema([registerSchema('Test', z.intersection(Person, Employee))], {
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

  it.concurrent('supports nullable intersection types', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    expectSchema(
      [registerSchema('Test', z.intersection(Person, Employee).nullable())],
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

  it.concurrent('supports default intersection types', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    expectSchema(
      [
        registerSchema(
          'Test',
          z
            .intersection(Person, Employee)
            .default({ name: 'hello', role: 'world' })
        ),
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

  it.concurrent('supports nullable default intersection types', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    expectSchema(
      [
        registerSchema(
          'Test',
          z
            .intersection(Person, Employee)
            .nullable()
            .default({ name: 'hello', role: 'world' })
        ),
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
