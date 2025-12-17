// Simple event-based store to bypass React closure scope issues in large files
// This allows triggering modals from anywhere without relying on local state scope

const listeners = new Set();
let currentState = { type: null, id: null };
let callbacks = { onToken: null, onSale: null };

export const saleModalStore = {
    // Get current value
    get: () => currentState,

    // Subscribe to changes
    subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    // Actions
    openTokenModal: (id) => {
        currentState = { type: 'token', id };
        listeners.forEach(l => l(currentState));
    },

    openSaleModal: (id) => {
        currentState = { type: 'complete', id };
        listeners.forEach(l => l(currentState));
    },

    close: () => {
        currentState = { type: null, id: null };
        listeners.forEach(l => l(currentState));
    },

    // Teleportation Logic: Register callbacks from Parent to be used by Child
    registerCallbacks: ({ onToken, onSale }) => {
        callbacks = { onToken, onSale };
    },

    executeTokenPaid: (id) => {
        if (callbacks.onToken) return callbacks.onToken(id);
    },

    executeSaleComplete: (id) => {
        if (callbacks.onSale) return callbacks.onSale(id);
    }
};
