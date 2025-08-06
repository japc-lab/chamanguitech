const { response } = require('express');

const { getAll, getById, create, update, remove } = require('../services/fisherman.service');

const getAllFishermen = async (req, res = response) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const fishermen = await getAll(includeDeleted);
        res.json({ ok: true, data: fishermen });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getFishermanById = async (req, res = response) => {
    try {
        const fisherman = await getById(req.params.id);
        if (!fisherman) {
            return res.status(404).json({ ok: false, message: 'Fisherman not found' });
        }
        res.json({ ok: true, data: fisherman });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const createFisherman = async (req, res = response) => {
    try {
        const fisherman = await create(req.body);
        res.status(201).json({ ok: true, message: 'Fisherman created successfully', data: fisherman });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const updateFisherman = async (req, res = response) => {
    try {
        const fisherman = await update(req.params.id, req.body);
        if (!fisherman) {
            return res.status(404).json({ ok: false, message: 'Fisherman not found or already deleted' });
        }
        res.json({ ok: true, data: fisherman });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const removeFisherman = async (req, res) => {
    try {
        const fisherman = await remove(req.params.id);
        if (!fisherman) {
            return res.status(404).json({ ok: false, message: 'Fisherman not found' });
        }
        res.json({ ok: true, message: 'Fisherman deleted successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    getAllFishermen,
    getFishermanById,
    createFisherman,
    updateFisherman,
    removeFisherman
}; 