const { response } = require('express');
const { getById, getAllByCompany, create, update, remove, getAllDistinctPeriodNamesSorted, getPricesForCompanyByPeriodName } = require('../services/period-size-price.service');

const getPeriodById = async (req, res = response) => {
    try {
        const id = req.params.id;

        // Fetch period by id and company, including sizePrices
        const period = await getById(req.params.id);

        if (!period) {
            return res.status(404).json({ ok: false, message: 'Period not found' });
        }

        res.json({ ok: true, data: period });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getAllPeriodsByCompany = async (req, res = response) => {
    try {
        const { companyId } = req.query;

        const periods = await getAllByCompany(companyId);

        res.json({ ok: true, data: periods });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const createPeriod = async (req, res = response) => {
    try {
        const period = await create(req.body);
        res.status(201).json({ ok: true, message: 'Period and SizePrices created successfully', data: period });
    } catch (error) {
        res.status(400).json({ ok: false, message: error.message });
    }
};

const updatePeriod = async (req, res = response) => {
    try {
        const { id } = req.params;

        // Ensure only `sizePrices` is updated
        const updatedPeriod = await update(id, req.body);

        res.json({ ok: true, message: 'Period sizePrices updated successfully', data: updatedPeriod });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const removePeriod = async (req, res) => {
    try {
        const result = await remove(req.params.id);
        res.json({ ok: true, message: result.message });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getAllDistinctPeriodNames = async (req, res = response) => {
    try {
        const names = await getAllDistinctPeriodNamesSorted();
        res.json({ ok: true, data: names });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getAllPricesForCompanyByPeriodName = async (req, res = response) => {
    try {
        const { periodName } = req.query;
        if (!periodName) {
            return res.status(400).json({ ok: false, message: 'periodName is required' });
        }
        const result = await getPricesForCompanyByPeriodName(periodName);
        res.json({ ok: true, data: result });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    getPeriodById,
    getAllPeriodsByCompany,
    createPeriod,
    updatePeriod,
    removePeriod,
    getAllDistinctPeriodNames,
    getAllPricesForCompanyByPeriodName
};
