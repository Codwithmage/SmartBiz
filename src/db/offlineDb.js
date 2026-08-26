import Dexie from 'dexie';

export const offlineDb = new Dexie('SmartBizOfflineDB');

offlineDb.version(1).stores({
  products: 'id, business_id, name, category',
  services: 'id, business_id, name',
  expenses: '++id, business_id, created_at, synced',
  sales: '++id, business_id, created_at, synced',
});