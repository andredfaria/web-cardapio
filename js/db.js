const DB_NAME = 'CardapioDB';
const DB_VERSION = 1;
const STORE_DRINKS = 'drinks';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_DRINKS)) {
                db.createObjectStore(STORE_DRINKS, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject('Error opening DB: ' + event.target.error);
        };
    });
}

const dbOperations = {
    async addDrink(drink) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_DRINKS], 'readwrite');
            const store = transaction.objectStore(STORE_DRINKS);
            const request = store.add(drink);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllDrinks() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_DRINKS], 'readonly');
            const store = transaction.objectStore(STORE_DRINKS);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async updateDrink(drink) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_DRINKS], 'readwrite');
            const store = transaction.objectStore(STORE_DRINKS);
            const request = store.put(drink);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async deleteDrink(id) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_DRINKS], 'readwrite');
            const store = transaction.objectStore(STORE_DRINKS);
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getDrinkById(id) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_DRINKS], 'readonly');
            const store = transaction.objectStore(STORE_DRINKS);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};

window.dbOperations = dbOperations;
