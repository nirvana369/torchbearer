import Dexie from 'dexie';

const db = new Dexie('FileTreeDB');
db.version(1).stores({
  filechunk: 'id, chunkid, data'
});

export default db;