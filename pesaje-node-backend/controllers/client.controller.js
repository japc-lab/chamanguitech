const { response } = require('express');
const { getAllByUserId, getAll, getById, create, update, remove } = require('../services/client.service');

const getAllClientsByUserId = async (req, res = response) => {
    try {
        const { userId } = req.query;
        const includeDeleted = req.query.includeDeleted === 'true';
        const clients = await getAllByUserId(userId, includeDeleted);
        res.json({ ok: true, data: clients });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getAllClients = async (req, res = response) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const clients = await getAll(includeDeleted);
        res.json({ ok: true, data: clients });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getClientById = async (req, res = response) => {
    try {
        const client = await getById(req.params.id);
        if (!client) {
            return res.status(404).json({ ok: false, message: 'Client not found' });
        }
        res.json({ ok: true, data: client });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const createClient = async (req, res = response) => {
    try {
        const client = await create(req.body, req.id);
        res.status(201).json({ ok: true, message: 'Client created successfully', data: client });
    } catch (error) {
        console.error(`Error creating client: ${error.message}`);
        res.status(400).json({ ok: false, message: error.message });
    }
};

const updateClient = async (req, res = response) => {
    try {
        const client = await update(req.params.id, req.body);
        if (!client) {
            return res.status(404).json({ ok: false, message: 'Client not found' });
        }
        res.json({ ok: true, data: client });
    } catch (error) {
        console.error(`Error updating client: ${error.message}`);
        res.status(400).json({ ok: false, message: error.message });
    }
};

const removeClient = async (req, res) => {
    try {
        const client = await remove(req.params.id);
        if (!client) {
            return res.status(404).json({ ok: false, message: 'Client not found' });
        }
        res.json({ ok: true, message: 'Client deleted successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

module.exports = {
    getAllClientsByUserId,
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    removeClient
};
