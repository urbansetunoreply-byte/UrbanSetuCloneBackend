// Simple event-based store to bypass React closure scope issues in large files
// This allows triggering modals from anywhere without relying on local state scope

const listeners = new Set();
let currentState = { type: null };

export const saleModalStore = {
    // Get current value
    get: () => currentState,

    // Subscribe to changes
    subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    // Actions
    openTokenModal: () => {
        currentState = { type: 'token' };
        listeners.forEach(l => l(currentState));
    },

    openSaleModal: () => {
        currentState = { type: 'complete' };
        listeners.forEach(l => l(currentState));
    },

    close: () => {
        currentState = { type: null };
        listeners.forEach(l => l(currentState));
    }
};
