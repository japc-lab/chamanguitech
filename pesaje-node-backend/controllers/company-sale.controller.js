const { response } = require('express');
const { create, getById, getBySaleId, update } = require('../services/company-sale.service');

const createCompanySale = async (req, res = response) => {
    try {
        const companySale = await create(req.body);
        res.status(201).json({ ok: true, message: 'Company sale created successfully', data: companySale });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getCompanySaleById = async (req, res = response) => {
    try {
        const { id } = req.params;
        const sale = await getById(id);
        res.json({ ok: true, data: sale });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getCompanySaleBySaleId = async (req, res = response) => {
    try {
        const { saleId } = req.params;
        const data = await getBySaleId(saleId);
        res.json({ ok: true, data });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateCompanySale = async (req, res = response) => {
    try {
        const { id } = req.params;
        const updatedSale = await update(id, req.body);
        res.json({ ok: true, message: 'Company sale updated successfully', data: updatedSale });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    createCompanySale,
    getCompanySaleById,
    getCompanySaleBySaleId,
    updateCompanySale
};