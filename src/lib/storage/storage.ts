import 'server-only';
import { diskStorage } from './disk-storage';
import { supabaseStorage } from './supabase-storage';
import type { StorageDriver } from './types';

// Picked once per process by STORAGE_DRIVER. Everything outside this module
// — extraction, the upload action, the authenticated file route — imports
// saveFile/readFile from here and never knows which driver is active.
const driver: StorageDriver = process.env.STORAGE_DRIVER === 'supabase' ? supabaseStorage : diskStorage;

export const saveFile = driver.saveFile;
export const readFile = driver.readFile;
