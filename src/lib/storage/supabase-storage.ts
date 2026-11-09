import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { StorageDriver } from './types';

// Production driver — Supabase Storage, same project as the database.
// Uses the service-role key (server-only) so uploads bypass row-level
// security; the bucket should be private, reached only through this module.
let client: ReturnType<typeof createClient> | undefined;

function getClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when STORAGE_DRIVER=supabase');
  }

  client = createClient(url, serviceRoleKey);
  return client;
}

function bucketName(): string {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error('SUPABASE_STORAGE_BUCKET is required when STORAGE_DRIVER=supabase');
  }
  return bucket;
}

export const supabaseStorage: StorageDriver = {
  async saveFile(bytes, relativePath) {
    const { error } = await getClient()
      .storage.from(bucketName())
      .upload(relativePath, bytes, { upsert: true });

    if (error) throw error;
    return relativePath;
  },

  async readFile(relativePath) {
    const { data, error } = await getClient().storage.from(bucketName()).download(relativePath);
    if (error) throw error;
    return Buffer.from(await data.arrayBuffer());
  },
};
