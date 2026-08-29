import { useEffect, useState, useCallback } from 'react';
import { offlineDb } from '../db/offlineDb';
import supabase from '../supabase/SupabaseClient';

export function useNetworkSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncAllOfflineData = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);

    const syncTable = async (tableName) => {
      try {
        const allItems = await offlineDb[tableName].toArray();
        
        const pendingItems = allItems.filter(
          (item) => item.synced === 0 || item.synced === false || item.synced === undefined || item.synced === null
        );

        for (const item of pendingItems) {
          const { 
            id, 
            synced, 
            categories, 
            category,   
            products,   
            ...payload 
          } = item;
          
          if (typeof id === 'string' && (id.startsWith('offline_') || id.startsWith('temp_'))) {
            delete payload.id;
          }

          let response;

          // Products use upsert to resolve duplicate SKU conflicts gracefully
          if (tableName === 'products') {
            response = await supabase
              .from(tableName)
              .upsert([payload], { onConflict: 'business_id,sku' })
              .select();
          } else {
            response = await supabase.from(tableName).insert([payload]).select();
          }

          if (!response.error) {
            await offlineDb[tableName].delete(id);
          } else {
            // Fallback: If upsert fails on a unique constraint, delete local duplicate to clear sync loop
            if (response.error.code === '23505') {
              console.warn(`Removing duplicate local item from ${tableName} (ID: ${id}) to resolve unique constraint conflict.`);
              await offlineDb[tableName].delete(id);
            } else {
              console.error(`Supabase sync error on ${tableName}:`, response.error.message);
            }
          }
        }
      } catch (err) {
        console.error(`Error syncing table ${tableName}:`, err);
      }
    };

    await syncTable('products');
    await syncTable('services');
    await syncTable('expenses');
    await syncTable('sales');

    setIsSyncing(false);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncAllOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    if (navigator.onLine) {
      syncAllOfflineData();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncAllOfflineData]);

  return { isOnline, isSyncing, triggerSync: syncAllOfflineData };
}