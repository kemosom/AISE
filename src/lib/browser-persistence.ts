const DB_NAME = 'aise-lab-studio';
const STORE_NAME = 'student-work';
const DB_VERSION = 1;

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Unable to open local student storage.'));
  });

  return databasePromise;
}

export async function getBrowserValue<T>(key: string): Promise<T | null> {
  const db = await openDatabase();

  return await new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);

    request.onsuccess = () => {
      resolve(request.result === undefined ? null : (request.result as T));
    };
    request.onerror = () =>
      reject(request.error || new Error(`Unable to read local value: ${key}`));
  });
}

export async function setBrowserValue(key: string, value: unknown): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);

    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error || new Error(`Unable to save local value: ${key}`));
    tx.onabort = () =>
      reject(tx.error || new Error(`Local save was aborted: ${key}`));
  });
}

export async function deleteBrowserValue(key: string): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);

    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error || new Error(`Unable to delete local value: ${key}`));
  });
}
