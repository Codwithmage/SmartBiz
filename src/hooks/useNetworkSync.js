import { useEffect, useState } from 'react';
import { offlineDb } from '../db/offlineDb';
import supabase from '../supabase/SupabaseClient';

export function useNetworkSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const syncAllOfflineData = async () => {
      setIsOnline(true);

      // 1. Sync Pending Sales
      const pendingSales = await offlineDb.sales.where({ synced: 0 }).toArray();
      for (const sale of pendingSales) {
        const { id, synced, ...payload } = sale;
        const { error } = await supabase.from('sales').insert([payload]);
        if (!error) await offlineDb.sales.delete(id);
      }

      // 2. Sync Pending Expenses
      const pendingExpenses = await offlineDb.expenses.where({ synced: 0 }).toArray();
      for (const expense of pendingExpenses) {
        const { id, synced, ...payload } = expense;
        const { error } = await supabase.from('expenses').insert([payload]);
        if (!error) await offlineDb.expenses.delete(id);
      }
    };

    window.addEventListener('online', syncAllOfflineData);
    window.addEventListener('offline', () => setIsOnline(false));

    return () => {
      window.removeEventListener('online', syncAllOfflineData);
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  return { isOnline };
}