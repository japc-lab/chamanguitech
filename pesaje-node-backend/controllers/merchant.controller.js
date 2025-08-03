const { response } = require('express');

const { getAll, getById, create, update, remove } = require('../services/merchant.service');

const getAllMerchants = async (req, res = response) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const merchants = await getAll(includeDeleted);
        res.json({ ok: true, data: merchants });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getMerchantById = async (req, res = response) => {
    try {
        const merchant = await getById(req.params.id);
        if (!merchant) {
            return res.status(404).json({ ok: false, message: 'Merchant not found' });
        }
        res.json({ ok: true, data: merchant });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const createMerchant = async (req, res = response) => {
    try {
        const merchant = await create(req.body);
        res.status(201).json({ ok: true, message: 'Merchant created successfully', data: merchant });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateMerchant = async (req, res = response) => {
    try {
        const merchant = await update(req.params.id, req.body);
        if (!merchant) {
            return res.status(404).json({ ok: false, message: 'Merchant not found or already deleted' });
        }
        res.json({ ok: true, data: merchant });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const removeMerchant = async (req, res) => {
    try {
        const merchant = await remove(req.params.id);
        if (!merchant) {
            return res.status(404).json({ ok: false, message: 'Merchant not found' });
        }
        res.json({ ok: true, message: 'Merchant deleted successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    getAllMerchants,
    getMerchantById,
    createMerchant,
    updateMerchant,
    removeMerchant
}; 