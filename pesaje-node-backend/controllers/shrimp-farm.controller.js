const { response } = require('express');
const {
    getAll,
    getAllByClientIdAndUserId,
    getById,
    create,
    update,
    remove
} = require('../services/shrimp-farm.service');

const getAllShrimpFarms = async (req, res = response) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const shrimpFarms = await getAll(includeDeleted);
        res.json({ ok: true, data: shrimpFarms });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getShrimpFarmsByClientIdAndUserId = async (req, res = response) => {
    try {
        const { clientId, userId } = req.query;
        const includeDeleted = req.query.includeDeleted === 'true';

        const shrimpFarms = await getAllByClientIdAndUserId(clientId, userId, includeDeleted);

        res.json({ ok: true, data: shrimpFarms });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};


const getShrimpFarmById = async (req, res = response) => {
    try {
        const shrimpFarm = await getById(req.params.id);
        if (!shrimpFarm) {
            return res.status(404).json({ ok: false, message: 'Shrimp farm not found' });
        }
        res.json({ ok: true, data: shrimpFarm });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const createShrimpFarm = async (req, res = response) => {
    try {
        const shrimpFarm = await create(req.body);
        res.status(201).json({ ok: true, message: 'Shrimp farm created successfully', data: shrimpFarm });
    } catch (error) {
        res.status(400).json({ ok: false, message: error.message });
    }
};

const updateShrimpFarm = async (req, res = response) => {
    try {
        const shrimpFarm = await update(req.params.id, req.body);
        if (!shrimpFarm) {
            return res.status(404).json({ ok: false, message: 'Shrimp farm not found' });
        }
        res.json({ ok: true, data: shrimpFarm });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const removeShrimpFarm = async (req, res) => {
    try {
        const shrimpFarm = await remove(req.params.id);
        if (!shrimpFarm) {
            return res.status(404).json({ ok: false, message: 'Shrimp farm not found' });
        }
        res.json({ ok: true, message: 'Shrimp farm deleted successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    getAllShrimpFarms,
    getShrimpFarmsByClientIdAndUserId,
    getShrimpFarmById,
    createShrimpFarm,
    updateShrimpFarm,
    removeShrimpFarm
};
