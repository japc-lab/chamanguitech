const { response } = require('express');
const { create, getBySaleId, update } = require('../services/local-sale.service');

const createLocalSale = async (req, res = response) => {
    try {
        const localSale = await create(req.body);
        res.status(201).json({ ok: true, message: 'Local sale created successfully', data: localSale });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getLocalSaleBySaleId = async (req, res = response) => {
    try {
        const { saleId } = req.params;
        const localSale = await getBySaleId(saleId);
        res.json({ ok: true, data: localSale });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateLocalSale = async (req, res = response) => {
    try {
        const { id } = req.params;
        const updated = await update(id, req.body);
        res.json({ ok: true, message: 'Local Sale updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    createLocalSale, getLocalSaleBySaleId, updateLocalSale
};
