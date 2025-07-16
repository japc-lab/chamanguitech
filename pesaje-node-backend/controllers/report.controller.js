const { response } = require('express');
const reportService = require('../services/report.service');

const getEconomicReportByParams = async (req, res = response) => {
    try {
        const { includeDeleted, clientId, userId, periodId, controlNumber } = req.query;

        const filters = {
            includeDeleted: includeDeleted === 'true',
            clientId,
            userId,
            periodId,
            controlNumber
        };

        const report = await reportService.getEconomicReportByParams(filters);

        res.json({ ok: true, data: report });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getTotalReportByParams = async (req, res = response) => {
    try {
        const { includeDeleted, clientId, userId, periodId, controlNumber } = req.query;

        const filters = {
            includeDeleted: includeDeleted === 'true',
            clientId,
            userId,
            periodId,
            controlNumber
        };

        const report = await reportService.getTotalReportByParams(filters);

        res.json({ ok: true, data: report });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const createTotalReport = async (req, res = response) => {
    try {
        const data = req.body;
        const totalReport = await reportService.createTotalReport(data);
        res.status(201).json({ ok: true, message: 'Total Report created successfully', data: totalReport });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getRecordedTotalReportByControlNumber = async (req, res = response) => {
    try {
        const { controlNumber } = req.query;

        const report = await reportService.getRecordedTotalReportByControlNumber(controlNumber);

        res.json({
            ok: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: error.message
        });
    }
};

module.exports = {
    getEconomicReportByParams,
    getTotalReportByParams,
    createTotalReport,
    getRecordedTotalReportByControlNumber
};
