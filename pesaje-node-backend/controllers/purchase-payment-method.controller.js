const { response } = require('express');
const {
    createPaymentMethod,
    getPaymentsByPurchase,
    updatePaymentMethod,
    removePaymentMethod
} = require('../services/purchase-payment-method.service');

const createPurchasePaymentMethod = async (req, res = response) => {
    try {
        const data = req.body;
        const paymentMethod = await createPaymentMethod(data);
        res.status(201).json({ ok: true, message: 'Payment method recorded successfully', data: paymentMethod });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getPurchasePaymentsByPurchaseId = async (req, res = response) => {
    try {
        const { purchaseId } = req.query;
        const payments = await getPaymentsByPurchase(purchaseId);

        res.json({ ok: true, data: payments });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updatePurchasePaymentMethod = async (req, res = response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedPayment = await updatePaymentMethod(id, data);

        res.json({ ok: true, message: 'Payment method updated successfully', data: updatedPayment });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};


const deletePurchasePaymentMethod = async (req, res = response) => {
    try {
        const { id } = req.params;
        await removePaymentMethod(id);
        res.json({ ok: true, message: 'Payment method deleted successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    createPurchasePaymentMethod,
    getPurchasePaymentsByPurchaseId,
    updatePurchasePaymentMethod,
    deletePurchasePaymentMethod
};
