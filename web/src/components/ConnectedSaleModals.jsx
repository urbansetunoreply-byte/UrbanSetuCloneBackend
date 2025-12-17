import React, { useState, useEffect } from 'react';
import { saleModalStore } from '../utils/saleModalStore';
import TokenPaidModal from './TokenPaidModal';
import SaleCompleteModal from './SaleCompleteModal';

/**
 * Connected component that listens to the external saleModalStore.
 * This bypasses passing 'isOpen' props from the parent, avoiding closure scope ReferenceErrors.
 */
const ConnectedSaleModals = ({ onConfirmTokenPaid, onConfirmSaleComplete }) => {
    const [state, setState] = useState(saleModalStore.get());

    useEffect(() => {
        return saleModalStore.subscribe((newState) => {
            setState(newState);
        });
    }, []);

    const handleClose = () => {
        saleModalStore.close();
    };

    const handleConfirmToken = () => {
        if (state.id && onConfirmTokenPaid) {
            onConfirmTokenPaid(state.id);
        }
    };

    const handleConfirmSale = () => {
        if (state.id && onConfirmSaleComplete) {
            onConfirmSaleComplete(state.id);
        }
    };

    return (
        <>
            <TokenPaidModal
                isOpen={state.type === 'token'}
                onClose={handleClose}
                onConfirm={handleConfirmToken}
            />
            <SaleCompleteModal
                isOpen={state.type === 'complete'}
                onClose={handleClose}
                onConfirm={handleConfirmSale}
            />
        </>
    );
};

export default ConnectedSaleModals;
