const fs = require('node:fs');
const path = require('node:path');
const { put, list, head } = require('@vercel/blob');

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const DB_BLOB_PATH = 'database/smit_attendance.db';

let lastBackupTime = null;
let isSyncing = false;
let isDirty = false;

function isVercelStorageConfigured() {
  return !!BLOB_TOKEN;
}

function markDatabaseDirty() {
  isDirty = true;
}

/**
 * Upload an evidence document (medical cert, OD letter, etc.) directly to Vercel Blob
 */
async function uploadEvidenceToVercel(buffer, filename, contentType) {
  if (!BLOB_TOKEN) {
    return null;
  }

  try {
    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blobPath = `evidence/${Date.now()}_${cleanName}`;
    const result = await put(blobPath, buffer, {
      access: 'public',
      token: BLOB_TOKEN,
      contentType: contentType || 'application/octet-stream'
    });
    return result.url;
  } catch (err) {
    console.error('[Vercel Storage] Failed to upload evidence file:', err.message);
    return null;
  }
}

/**
 * Backup the active SQLite database file to Vercel Blob storage
 */
async function backupDatabaseToVercel(dbPath) {
  if (!BLOB_TOKEN || isSyncing) {
    return { success: false, reason: !BLOB_TOKEN ? 'no_token' : 'syncing' };
  }

  // Force checkpoint if WAL was used, ensuring all pending transactions are flushed to disk
  try {
    const { checkpointDb } = require('./db');
    checkpointDb();
  } catch (e) {
    // Ignore checkpoint errors
  }

  if (!fs.existsSync(dbPath)) {
    return { success: false, reason: 'db_not_found' };
  }

  isSyncing = true;
  try {
    const dbBuffer = fs.readFileSync(dbPath);
    if (dbBuffer.length <= 4096) {
      isSyncing = false;
      console.warn(`[Vercel Storage] Database buffer is too small (${dbBuffer.length} bytes). Skipping backup to avoid overwriting valid cloud snapshot.`);
      return { success: false, reason: 'unpopulated_db' };
    }

    const blob = await put(DB_BLOB_PATH, dbBuffer, {
      access: 'public',
      token: BLOB_TOKEN,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/x-sqlite3'
    });

    lastBackupTime = new Date().toISOString();
    isDirty = false;
    console.log(`[Vercel Storage] Database snapshot persisted to Vercel Blob: ${blob.url} (${dbBuffer.length} bytes)`);
    return { success: true, url: blob.url, time: lastBackupTime, size: dbBuffer.length };
  } catch (err) {
    console.error('[Vercel Storage] Backup failed:', err.message);
    return { success: false, error: err.message };
  } finally {
    isSyncing = false;
  }
}

/**
 * Restore the SQLite database from Vercel Blob storage if a snapshot exists
 */
async function restoreDatabaseFromVercel(targetPath) {
  if (!BLOB_TOKEN) {
    console.log('[Vercel Storage] BLOB_READ_WRITE_TOKEN not set; skipping cloud restore.');
    return false;
  }

  try {
    console.log('[Vercel Storage] Checking for existing database snapshot in Vercel Blob...');
    const { blobs } = await list({
      prefix: 'database/',
      token: BLOB_TOKEN
    });

    const dbBlob = blobs.find(b => b.pathname === DB_BLOB_PATH);
    if (!dbBlob) {
      console.log('[Vercel Storage] No remote snapshot found in Vercel Blob. Starting fresh seed.');
      return false;
    }

    // Ignore tiny or unpopulated snapshots (<= 4096 bytes)
    if (dbBlob.size <= 4096) {
      console.warn(`[Vercel Storage] Remote database snapshot is unpopulated (${dbBlob.size} bytes). Skipping restore to preserve local seed.`);
      return false;
    }

    console.log(`[Vercel Storage] Downloading remote snapshot from ${dbBlob.url} (${dbBlob.size} bytes)...`);
    const res = await fetch(dbBlob.url);
    if (!res.ok) {
      throw new Error(`Failed to fetch blob: HTTP ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length <= 4096) {
      console.warn(`[Vercel Storage] Downloaded buffer too small (${buffer.length} bytes). Skipping restore.`);
      return false;
    }

    // Ensure directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Close existing database instance if open, so SQLite reloads from the new file
    try {
      const { closeDb } = require('./db');
      closeDb();
    } catch (e) {
      // Ignore
    }

    fs.writeFileSync(targetPath, buffer);
    lastBackupTime = dbBlob.uploadedAt ? new Date(dbBlob.uploadedAt).toISOString() : new Date().toISOString();
    console.log(`[Vercel Storage] Database successfully restored from Vercel Blob (${buffer.length} bytes)`);
    return true;
  } catch (err) {
    console.error('[Vercel Storage] Failed to restore database from Vercel Blob:', err.message);
    return false;
  }
}

/**
 * Get current storage health and status
 */
function getStorageStatus() {
  return {
    provider: 'Vercel Blob Storage',
    configured: isVercelStorageConfigured(),
    lastBackupTime,
    isSyncing,
    isDirty,
    blobStoreId: process.env.BLOB_STORE_ID || null
  };
}

module.exports = {
  isVercelStorageConfigured,
  markDatabaseDirty,
  uploadEvidenceToVercel,
  backupDatabaseToVercel,
  restoreDatabaseFromVercel,
  getStorageStatus
};
