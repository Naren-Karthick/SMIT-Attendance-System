import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { safeApiFetch } from '../utils/api';

interface StorageInfo {
  provider: string;
  configured: boolean;
  lastBackupTime: string | null;
  syncIntervalSec: number;
}

interface SyncContextType {
  lastSyncedAt: Date;
  isSyncing: boolean;
  countdown: number;
  storageInfo: StorageInfo | null;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

const SYNC_INTERVAL = 30; // 30 seconds auto-sync

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshMe } = useAuth();
  const { showToast } = useToast();

  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(SYNC_INTERVAL);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  // Core sync function
  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem('smit_token');

      // 1. Fetch live storage status & ping API
      const statusPromise = safeApiFetch<StorageInfo>('/api/storage/status')
        .then(data => {
          if (data) setStorageInfo(data);
        })
        .catch(() => {});

      // 2. Refresh auth & notifications in background
      const authPromise = refreshMe();

      // 3. Dispatch global sync event for active page components to refetch
      window.dispatchEvent(new CustomEvent('smit:sync', {
        detail: { timestamp: new Date().toISOString() }
      }));

      await Promise.allSettled([statusPromise, authPromise]);
      setLastSyncedAt(new Date());
      setCountdown(SYNC_INTERVAL);
    } catch (err) {
      console.error('[AutoSync] Background synchronization failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshMe]);

  // Initial load
  useEffect(() => {
    triggerSync();
  }, []);

  // 30-second interval timer & 1-second countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          triggerSync();
          return SYNC_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [triggerSync]);

  return (
    <SyncContext.Provider
      value={{
        lastSyncedAt,
        isSyncing,
        countdown,
        storageInfo,
        triggerSync
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

/**
 * Custom hook for pages to register an auto-refresh listener on every 30s sync
 */
export const useAutoSyncListener = (callback: () => void) => {
  useEffect(() => {
    const handleSync = () => {
      callback();
    };

    window.addEventListener('smit:sync', handleSync);
    return () => window.removeEventListener('smit:sync', handleSync);
  }, [callback]);
};
