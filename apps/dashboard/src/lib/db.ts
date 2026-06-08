import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export interface ProjectDoc {
  _id?: ObjectId;
  id: string;
  userId: string;
  name: string;
  framework: string;
  repoName: string;
  branch: string;
  hostingProvider?: string | null;
  vercelProjectId?: string | null;
  vercelProjectName?: string | null;
  netlifySiteId?: string | null;
  netlifySiteName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchemaDoc {
  _id?: ObjectId;
  projectId: string;
  schema: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentDoc {
  _id?: ObjectId;
  projectId: string;
  content: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationDoc {
  _id?: ObjectId;
  id: string;
  userId: string;
  provider: string;
  token: string;
  workspaceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getDb() {
  const client = await clientPromise;
  return client.db();
}

export async function getProjects(userId: string): Promise<ProjectDoc[]> {
  const db = await getDb();
  return db.collection<ProjectDoc>('projects').find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function getProjectById(id: string, userId: string): Promise<ProjectDoc | null> {
  const db = await getDb();
  return db.collection<ProjectDoc>('projects').findOne({ id, userId });
}

export async function createProject(project: Omit<ProjectDoc, 'createdAt' | 'updatedAt'>): Promise<ProjectDoc> {
  const db = await getDb();
  const doc: ProjectDoc = {
    ...project,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection<ProjectDoc>('projects').insertOne(doc);
  return doc;
}

export async function getProjectSchema(projectId: string): Promise<any | null> {
  const db = await getDb();
  const doc = await db.collection<SchemaDoc>('schemas').findOne({ projectId });
  return doc ? doc.schema : null;
}

export async function saveProjectSchema(projectId: string, schema: any): Promise<void> {
  const db = await getDb();
  await db.collection<SchemaDoc>('schemas').updateOne(
    { projectId },
    {
      $set: {
        schema,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      }
    },
    { upsert: true }
  );
}

export async function getProjectContent(projectId: string): Promise<any | null> {
  const db = await getDb();
  const doc = await db.collection<ContentDoc>('contents').findOne({ projectId });
  return doc ? doc.content : null;
}

export async function saveProjectContent(projectId: string, content: any): Promise<void> {
  const db = await getDb();
  await db.collection<ContentDoc>('contents').updateOne(
    { projectId },
    {
      $set: {
        content,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      }
    },
    { upsert: true }
  );
}

export async function getIntegration(userId: string, provider: string): Promise<IntegrationDoc | null> {
  const db = await getDb();
  return db.collection<IntegrationDoc>('integrations').findOne({ userId, provider });
}

export async function saveIntegration(userId: string, provider: string, token: string, workspaceId?: string | null): Promise<void> {
  const db = await getDb();
  await db.collection<IntegrationDoc>('integrations').updateOne(
    { userId, provider },
    {
      $set: {
        token,
        workspaceId: workspaceId || null,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        id: 'int_' + Math.random().toString(36).substring(2, 11),
        createdAt: new Date(),
      }
    },
    { upsert: true }
  );
}

export async function deleteIntegration(userId: string, provider: string): Promise<void> {
  const db = await getDb();
  await db.collection<IntegrationDoc>('integrations').deleteOne({ userId, provider });
}

export async function getGitHubToken(userId: string): Promise<string | null> {
  const db = await getDb();
  let userObjectId: any = userId;
  try {
    userObjectId = new ObjectId(userId);
  } catch (e) {}

  const account = await db.collection('accounts').findOne({
    $or: [
      { userId: userId, provider: 'github' },
      { userId: userObjectId, provider: 'github' }
    ]
  });

  return account ? (account.access_token as string || account.accessToken as string || null) : null;
}

export async function updateProject(
  id: string,
  userId: string,
  updates: Partial<Omit<ProjectDoc, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<ProjectDoc | null> {
  const db = await getDb();
  await db.collection<ProjectDoc>('projects').updateOne(
    { id, userId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      }
    }
  );
  return getProjectById(id, userId);
}

export async function deleteProject(id: string, userId: string): Promise<boolean> {
  const db = await getDb();
  await Promise.all([
    db.collection<ProjectDoc>('projects').deleteOne({ id, userId }),
    db.collection<SchemaDoc>('schemas').deleteOne({ projectId: id }),
    db.collection<ContentDoc>('contents').deleteOne({ projectId: id }),
  ]);
  return true;
}
