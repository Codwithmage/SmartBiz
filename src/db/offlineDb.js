import Dexie from 'dexie';

export const offlineDb = new Dexie('SmartBizOfflineDB');

offlineDb.version(1).stores({
  products: '++id, business_id, name, category, synced',
  services: '++id, business_id, name, synced',
  expenses: '++id, business_id, created_at, synced',
  sales: '++id, business_id, created_at, synced',
  categories: "id, business_id, name",
});
window.offlineDb = offlineDb;