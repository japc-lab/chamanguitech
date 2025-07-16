const { response } = require('express');
const logisticsService = require('../services/logistics.service');

const createLogistics = async (req, res = response) => {
    try {
        const data = req.body;
        const result = await logisticsService.create(data);
        res.status(201).json({ ok: true, data: result });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getLogisticsByParams = async (req, res = response) => {
    try {
        const { userId, controlNumber } = req.query;
        const includeDeleted = req.query.includeDeleted === 'true';

        const data = await logisticsService.getAllByParams({ userId, controlNumber, includeDeleted });
        res.json({ ok: true, data });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};


const getLogisticsById = async (req, res = response) => {
    try {
        const { id } = req.params;
        const data = await logisticsService.getById(id);
        res.json({ ok: true, data });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateLogistics = async (req, res = response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updated = await logisticsService.update(id, data);

        res.json({ ok: true, message: 'Logistics updated successfully', data: updated });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};


const deleteLogistics = async (req, res = response) => {
    try {
        const { id } = req.params;
        await logisticsService.remove(id);
        res.json({ ok: true, message: 'Logistics deleted successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    createLogistics,
    getLogisticsByParams,
    getLogisticsById,
    updateLogistics,
    deleteLogistics
};
