const { response } = require('express');
const {
    createPaymentMethod,
    getPaymentsByCompanySale,
    updatePaymentMethod,
    removePaymentMethod
} = require('../services/company-sale-payment-method.service');

const createCompanySalePaymentMethod = async (req, res = response) => {
    try {
        const data = req.body;
        const paymentMethod = await createPaymentMethod(data);
        res.status(201).json({ ok: true, message: 'Payment method recorded successfully', data: paymentMethod });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getCompanySalePaymentsBySaleId = async (req, res = response) => {
    try {
        const { companySaleId } = req.query;
        const payments = await getPaymentsByCompanySale(companySaleId);
        res.json({ ok: true, data: payments });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateCompanySalePaymentMethod = async (req, res = response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedPayment = await updatePaymentMethod(id, data);
        res.json({ ok: true, message: 'Payment method updated successfully', data: updatedPayment });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const deleteCompanySalePaymentMethod = async (req, res = response) => {
    try {
        const { id } = req.params;
        await removePaymentMethod(id);
        res.json({ ok: true, message: 'Payment method deleted successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    createCompanySalePaymentMethod,
    getCompanySalePaymentsBySaleId,
    updateCompanySalePaymentMethod,
    deleteCompanySalePaymentMethod
};
