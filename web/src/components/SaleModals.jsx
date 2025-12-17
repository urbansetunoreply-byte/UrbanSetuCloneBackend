import React from 'react';
import TokenPaidModal from './TokenPaidModal';
import SaleCompleteModal from './SaleCompleteModal';

export const SaleModals = ({
    activeSaleModal,
    onClose,
    onConfirmTokenPaid,
    onConfirmSaleComplete
}) => {
    return (
        <>
            <TokenPaidModal
                isOpen={activeSaleModal === 'token'}
                onClose={onClose}
                onConfirm={onConfirmTokenPaid}
            />
            <SaleCompleteModal
                isOpen={activeSaleModal === 'complete'}
                onClose={onClose}
                onConfirm={onConfirmSaleComplete}
            />
        </>
    );
};

export default SaleModals;
