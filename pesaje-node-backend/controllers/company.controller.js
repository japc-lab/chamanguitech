const { response } = require('express');
const { getAll, getById, create, update, remove } = require('../services/company.service');

const getCompanies = async (req, res = response) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const data = await getAll(includeDeleted);
        res.status(200).json({
            ok: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: error.message
        });
    }
};

const getCompanyById = async (req, res = response) => {
    try {
        const { id } = req.params;
        const company = await getById(id);
        if (!company) {
            return res.status(404).json({ ok: false, message: 'Company not found' });
        }
        res.status(200).json({
            ok: true,
            data: company
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message
        });
    }
};

const createCompany = async (req, res = response) => {
    try {
        const company = await create(req.body);
        res.status(201).json({
            ok: true,
            message: 'Company created successfully',
            data: company
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message
        });
    }
};

const updateCompany = async (req, res = response) => {
    try {
        const { id } = req.params;
        const company = await update(id, req.body);
        if (!company) {
            return res.status(404).json({ ok: false, message: 'Company not found' });
        }
        res.json({ ok: true, message: 'Company updated successfully', data: company });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message
        });
    }
};

const deleteCompany = async (req, res = response) => {
    try {
        const company = await remove(req.params.id);
        if (!company) {
            return res.status(404).json({ ok: false, message: 'Company not found' });
        }
        res.json({ ok: true, message: 'Company deleted successfully' });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: error.message
        });
    }
};

module.exports = {
    getCompanies,
    getCompanyById,
    createCompany,
    updateCompany,
    deleteCompany
}