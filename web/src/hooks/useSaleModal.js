import { useState, useCallback } from 'react';

/**
 * Custom hook to manage the state of sale confirmation modals.
 * Extracted to avoid closure/scope issues in the large MyAppointments component.
 */
export const useSaleModal = () => {
    const [modalType, setModalType] = useState(null); // 'token' | 'complete' | null

    const openTokenModal = useCallback(() => setModalType('token'), []);
    const openSaleModal = useCallback(() => setModalType('complete'), []);
    const closeModals = useCallback(() => setModalType(null), []);

    return {
        modalType,
        openTokenModal,
        openSaleModal,
        closeModals
    };
};
