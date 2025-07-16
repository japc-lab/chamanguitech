const { response } = require('express');
const saleService = require('../services/sale.service');



const getSalesByParams = async (req, res = response) => {
    try {
        const { userId, controlNumber } = req.query;
        const includeDeleted = req.query.includeDeleted === 'true';

        const data = await saleService.getAllByParams({ userId, controlNumber, includeDeleted });
        res.json({ ok: true, data });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const deleteSale = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await saleService.remove(id);
        res.json({ ok: true, message: 'Sale deleted successfully', data: result });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    getSalesByParams,
    deleteSale,
};
