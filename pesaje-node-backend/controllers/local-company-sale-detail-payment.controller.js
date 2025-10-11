const { response } = require('express');
const {
    createPayment,
    getPaymentsByLocalCompanySaleDetail,
    updatePayment,
    removePayment
} = require('../services/local-company-sale-detail-payment.service');

const createLocalCompanySaleDetailPayment = async (req, res = response) => {
    try {
        const data = req.body;
        const payment = await createPayment(data);
        res.status(201).json({ ok: true, message: 'Payment recorded successfully', data: payment });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getPaymentsByLocalCompanySaleDetailId = async (req, res = response) => {
    try {
        const { localCompanySaleDetailId } = req.query;
        const payments = await getPaymentsByLocalCompanySaleDetail(localCompanySaleDetailId);

        res.json({ ok: true, data: payments });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateLocalCompanySaleDetailPayment = async (req, res = response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedPayment = await updatePayment(id, data);

        res.json({ ok: true, message: 'Payment updated successfully', data: updatedPayment });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const deleteLocalCompanySaleDetailPayment = async (req, res = response) => {
    try {
        const { id } = req.params;
        await removePayment(id);
        res.json({ ok: true, message: 'Payment deleted successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    createLocalCompanySaleDetailPayment,
    getPaymentsByLocalCompanySaleDetailId,
    updateLocalCompanySaleDetailPayment,
    deleteLocalCompanySaleDetailPayment
};

