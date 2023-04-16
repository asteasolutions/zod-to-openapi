import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypeDescribe,
} from '../lib/helpers';

registrationTypeDescribe('intersection', registrationType => {
  it('supports intersection types', () => {
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
          z.intersection(Person, Employee),
          registrationType
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
        },
      }
    );
  });

  it('supports nullable intersection types', () => {
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
          z.intersection(Person, Employee).nullable(),
          registrationType
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
        registerSchema(
          'Test',
          z
            .intersection(Person, Employee)
            .default({ name: 'hello', role: 'world' }),
          registrationType
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

  it('supports nullable default intersection types', () => {
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
            .default({ name: 'hello', role: 'world' }),
          registrationType
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
