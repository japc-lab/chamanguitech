const { response } = require('express');
const {
    getAllByParams,
    getById,
    create,
    update,
    remove
} = require('../services/purchase.service');

const getAllPurchasesByParams = async (req, res = response) => {
    try {
        const { includeDeleted, clientId, userId, companyId, periodId, controlNumber } = req.query;

        const filters = {
            includeDeleted: includeDeleted === 'true',
            clientId,
            userId,
            companyId,
            periodId,
            controlNumber
        };

        const purchases = await getAllByParams(filters);

        res.json({ ok: true, data: purchases });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getPurchaseById = async (req, res = response) => {
    try {
        const purchase = await getById(req.params.id);
        if (!purchase) {
            return res.status(404).json({ ok: false, message: 'Purchase not found' });
        }
        res.json({ ok: true, data: purchase });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const createPurchase = async (req, res = response) => {
    try {
        const purchase = await create(req.body);
        res.status(201).json({ ok: true, data: purchase, message: 'Purchase created successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updatePurchase = async (req, res = response) => {
    try {
        const body = { ...req.body };
        //se elimina el status para que no cambie por el status antiguo que le llega del gestionar compra
        if (req.body.hasOwnProperty('status'))          
            delete body.status;
        const updatedPurchase = await update(req.params.id, body);
        res.json({ ok: true, data: updatedPurchase, message: 'Purchase updated successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const deletePurchase = async (req, res = response) => {
    try {
        await remove(req.params.id);
        res.json({ ok: true, message: 'Purchase deleted successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    getAllPurchasesByParams,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    deletePurchase
};
