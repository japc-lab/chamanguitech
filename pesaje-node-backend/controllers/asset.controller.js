const { response } = require('express');
const { getAll, getById, create, update, remove } = require('../services/asset.service');

const getAllAssets = async (req, res = response) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const assets = await getAll(includeDeleted);
        res.json({ ok: true, data: assets });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getAssetById = async (req, res = response) => {
    try {
        const asset = await getById(req.params.id);
        if (!asset) {
            return res.status(404).json({ ok: false, message: 'Asset not found' });
        }
        res.json({ ok: true, data: asset });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const createAsset = async (req, res = response) => {
    try {
        const asset = await create(req.body, req.id);
        res.status(201).json({ ok: true, message: 'Asset created successfully', data: asset });
    } catch (error) {
        console.error(`Error creating asset: ${error.message}`);
        res.status(400).json({ ok: false, message: error.message });
    }
};

const updateAsset = async (req, res = response) => {
    try {
        const asset = await update(req.params.id, req.body);
        if (!asset) {
            return res.status(404).json({ ok: false, message: 'Asset not found' });
        }
        res.json({ ok: true, data: asset });
    } catch (error) {
        console.error(`Error updating asset: ${error.message}`);
        res.status(400).json({ ok: false, message: error.message });
    }
};

const removeAsset = async (req, res) => {
    try {
        const asset = await remove(req.params.id);
        if (!asset) {
            return res.status(404).json({ ok: false, message: 'Asset not found' });
        }
        res.json({ ok: true, message: 'Asset deleted successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    getAllAssets,
    getAssetById,
    createAsset,
    updateAsset,
    removeAsset
}; 