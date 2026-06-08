import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import type { AdapterAccount } from 'next-auth/adapters';

// NextAuth.js v5 Schema
export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
});

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// Trigdit Project Management
export const projects = pgTable('project', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  framework: text('framework').default('nextjs').notNull(), // 'nextjs' | 'vite' | 'vanilla'
  
  // GitHub Details
  repoId: integer('repoId'), // GitHub repository ID
  repoName: text('repoName'), // owner/repo
  branch: text('branch').default('main').notNull(),
  
  // File Paths
  contentPath: text('contentPath').default('data/content.json').notNull(),
  schemaPath: text('schemaPath').default('trigdit.schema.json').notNull(),

  // Hosting Configurations
  hostingProvider: text('hostingProvider'), // 'vercel' | 'netlify'
  vercelProjectId: text('vercelProjectId'),
  vercelProjectName: text('vercelProjectName'),
  netlifySiteId: text('netlifySiteId'),
  netlifySiteName: text('netlifySiteName'),

  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
});

// Integrations (Credentials for Hosting services or Third-party connectors per user)
export const integrations = pgTable('integration', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'vercel' | 'netlify'
  token: text('token').notNull(), // Encrypted/plain API token
  workspaceId: text('workspaceId'), // for providers that need it (e.g. Vercel team ID)
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow(),
});

// Deployment History
export const deploys = pgTable('deploy', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text('projectId')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'pending' | 'success' | 'failed'
  deploymentUrl: text('deploymentUrl'),
  commitSha: text('commitSha'),
  errorMessage: text('errorMessage'),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
});
