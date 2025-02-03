import * as sdk from "matrix-js-sdk";
import type { MatrixClient } from 'matrix-js-sdk';
import { IndexedDBStore, } from 'matrix-js-sdk';
import { LocalStorage } from 'node-localstorage';
import setGlobalVars from 'indexeddbshim';

// Set up global window and IndexedDB shim
const win = globalThis as unknown as Window & typeof globalThis;
globalThis.window = win;
// Set up an origin to keep the indexeddb happy
globalThis.location = {origin: 'http://localhost'} as any;

// Initialize the IndexedDB shim with the window object
const shimInstance = setGlobalVars(win as any, {
    checkOrigin: false,
    databaseBasePath: './data',
    useSQLiteIndexes: true,
    // sqlBusyTimeout: 1000000,
    DEBUG: true  // Offers lots of storage debug
} as any);

if (typeof localStorage === 'undefined') {
    globalThis.localStorage = new LocalStorage('./data');
}

// Credential type
export type Credentials = {
    userId: string;
    accessToken: string;
    deviceId: string;
};
export async function main() {
    // Replace
    const credentials: Credentials = {
        userId: '@me:matrix.example.com',
        accessToken: 'syt_feedbeef',
        deviceId: 'YNKNGDMEEP',
    };
    const store = new IndexedDBStore({
        indexedDB: globalThis.indexedDB as IDBFactory,
        localStorage: globalThis.localStorage,
        dbName: 'wasm-me',
    });
    const client: MatrixClient = sdk.createClient({
        baseUrl: 'https://matrix.example.com', // Replace
        accessToken: credentials.accessToken,
        userId: credentials.userId,
        deviceId: credentials.deviceId,
        store: store,
    });
    try {
        await store.startup();
    } catch (error) {
        console.error('Failed to initialize client', error);
        throw error;
    }
    try {
        await client.initRustCrypto({
            useIndexedDB: true,
        });
    } catch (error) {
        console.error('Failed to initialize crypto', error);
        throw error;
    }
    if (client.getCrypto()) {
        console.log('Crypto initialized');
    } else {
        throw new Error('Crypto not initialized');
    }
    try {
        await client.startClient();
    } catch (error) {
        console.error('Failed to start client', error);
        throw error;
    }
}
main();
