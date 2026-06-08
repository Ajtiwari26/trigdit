import { z } from 'zod';

// Field type definitions
export const FieldTypeSchema = z.enum([
  'text',
  'textarea',
  'richtext',
  'image',
  'color',
  'number',
  'boolean',
]);
export type FieldType = z.infer<typeof FieldTypeSchema>;

// Field schema
export const FieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: FieldTypeSchema,
  description: z.string().optional(),
  defaultValue: z.any().optional(),
});
export type Field = z.infer<typeof FieldSchema>;

// Section schema
export const SectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  fields: z.array(FieldSchema),
});
export type Section = z.infer<typeof SectionSchema>;

// Page schema
export const PageSchema = z.object({
  path: z.string(), // e.g. '/', '/about'
  name: z.string(),
  sections: z.array(SectionSchema),
});
export type Page = z.infer<typeof PageSchema>;

// The complete project schema (trigdit.schema.json)
export const ProjectSchemaFileSchema = z.object({
  version: z.string(),
  pages: z.array(PageSchema),
});
export type ProjectSchemaFile = z.infer<typeof ProjectSchemaFileSchema>;

// The content layout data (content.json)
export const ContentDataSchema = z.record(z.record(z.record(z.any()))); // page -> sectionId -> fieldKey -> value
export type ContentData = z.infer<typeof ContentDataSchema>;

// postMessage Event Types
export const TrigditEventTypes = {
  BRIDGE_READY: 'TRIGDIT_BRIDGE_READY',
  SELECT_SECTION: 'TRIGDIT_SELECT_SECTION',
  UPDATE_FIELD: 'TRIGDIT_UPDATE_FIELD',
  HIGHLIGHT_SECTION: 'TRIGDIT_HIGHLIGHT_SECTION',
} as const;

export type TrigditEventType = typeof TrigditEventTypes[keyof typeof TrigditEventTypes];

export interface TrigditMessage {
  type: TrigditEventType;
  payload: any;
}
