// Local IndexedDB wrapper — all data stays on-device, no external calls
const DB_NAME = 'ConstellationsDB';
const DB_VERSION = 1;

const DB = {
  _db: null,

  open() {
    return new Promise((resolve, reject) => {
      if (this._db) return resolve(this._db);
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // Store for user sky observations
        if (!db.objectStoreNames.contains('observations')) {
          const obs = db.createObjectStore('observations', { keyPath: 'id', autoIncrement: true });
          obs.createIndex('timestamp', 'timestamp');
          obs.createIndex('objectName', 'objectName');
        }

        // Key-value store for user settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      req.onsuccess = (e) => { this._db = e.target.result; resolve(this._db); };
      req.onerror  = (e) => reject(e.target.error);
    });
  },

  // --- Observations ---

  async logObservation(objectName, lat, lon, az, alt, note = '') {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('observations', 'readwrite');
      const store = tx.objectStore('observations');
      const record = { timestamp: Date.now(), objectName, lat, lon, az, alt, note };
      const req = store.add(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  },

  async getObservations(limit = 50) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('observations', 'readonly');
      const index = tx.objectStore('observations').index('timestamp');
      const req = index.openCursor(null, 'prev'); // newest first
      const results = [];
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  },

  // --- Settings ---

  async setSetting(key, value) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const req = tx.objectStore('settings').put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  },

  async getSetting(key, defaultValue = null) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const req = tx.objectStore('settings').get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : defaultValue);
      req.onerror   = () => reject(req.error);
    });
  }
};
