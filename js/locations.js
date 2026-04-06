/**
 * Locations.js will implement the IndexedDB requirement
 * File holds database operations forr my Toronto BBQ locations
 */

const DB_NAME = 'TorontoBBQ';
const DB_VERSION = 1;
const STORE_NAME = 'locations';

/**
 * Open /create the indexeddb db
 */
function openDatabase() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onerror = () => {
            reject('Database opening sequence has failed.');
        };

        req.onsuccess = () => {
            resolve(req.result);
        };

        req.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create the object store if it doesnt exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectstore = db.createObjectStore(STORE_NAME, {
                     keyPath: 'id'
                });
                objectstore.createIndex('name', 'name', {
                     unique: false 
                });
                console.log('The object store ' + STORE_NAME + ' was created');
            }
        };
    });
}

/**
 * Check if locations data exists in indexededb
 */
async function hasLocations() {
    try {
        const db = await openDatabase();
        const tran = db.transaction([STORE_NAME], 'readonly');
        const objectstore = tran.objectStore(STORE_NAME);
        const count = objectstore.count();

        return new Promise((resolve, reject) => {
            count.onsuccess = () => {
                resolve(count.result > 0);
            };
            count.onerror = () => {
                reject('Error checking data');
            };
        });
    } catch (error) {
        console.error('Error (hasLocations): ', error);
        return false;
    }
}

/**
 * Store locations array in indexeddb
 */
async function storeLocations(locations) {
    try {
        const db = await openDatabase();
        const tran = db.transaction([STORE_NAME], 'readwrite');
        const objectstore = tran.objectStore(STORE_NAME);

        // Clear any data that exists first
        objectstore.clear();

        // Add each location
        locations.forEach(location => {
            objectstore.add(location);
        });

        return new Promise((resolve, reject) => {
            tran.oncomplete = () => {
                console.log('Locations stored successfully');
                resolve();
            };
            tran.onerror = () => {
                reject('Error storing locations');
            };
        });
    } catch (error) {
        console.error('Error (storeLocations): ', error);
        throw error;
    }
}

/**
 * Get all locations from indexeddb
 */
async function getLocations() {
    try {
        const db = await openDatabase();
        const tran = db.transaction([STORE_NAME], 'readonly');
        const objectstore = tran.objectStore(STORE_NAME);
        const req = objectstore.getAll();

        return new Promise((resolve, reject) => {
            req.onsuccess = () => {
                resolve(req.result);
            };
            req.onerror = () => {
                reject('Error retrieving locations');
            };
        });
    } catch (error) {
        console.error('Error (getLocations): ', error);
        return [];
    }
}

/**
 * Get a location by ID
 */
async function getLocationById(id) {
    try {
        const db = await openDatabase();
        const tran = db.transaction([STORE_NAME], 'readonly');
        const objectstore = tran.objectStore(STORE_NAME);
        const req = objectstore.get(parseInt(id));

        return new Promise((resolve, reject) => {
            req.onsuccess = () => {
                resolve(req.result);
            };
            req.onerror = () => {
                reject('Error retrieving location');
            };
        });
    } catch (error) {
        console.error('Error (getLocationById): ', error);
        return null;
    }
}