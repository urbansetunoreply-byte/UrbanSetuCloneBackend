import React, { useState, useEffect } from 'react';
import { saleModalStore } from '../utils/saleModalStore';
import TokenPaidModal from './TokenPaidModal';
import SaleCompleteModal from './SaleCompleteModal';

/**
 * Connected component that listens to the external saleModalStore.
 * This bypasses passing 'isOpen' props from the parent, avoiding closure scope ReferenceErrors.
 */
const ConnectedSaleModals = ({ onConfirmTokenPaid, onConfirmSaleComplete, setApptIdForAction }) => {
    const [state, setState] = useState(saleModalStore.get());

    useEffect(() => {
        return saleModalStore.subscribe((newState) => {
            setState(newState);
        });
    }, []);

    const handleClose = () => {
        saleModalStore.close();
        if (setApptIdForAction) setApptIdForAction(null);
    };

    return (
        <>
            <TokenPaidModal
                isOpen={state.type === 'token'}
                onClose={handleClose}
                onConfirm={onConfirmTokenPaid}
            />
            <SaleCompleteModal
                isOpen={state.type === 'complete'}
                onClose={handleClose}
                onConfirm={onConfirmSaleComplete}
            />
        </>
    );
};

export default ConnectedSaleModals;
