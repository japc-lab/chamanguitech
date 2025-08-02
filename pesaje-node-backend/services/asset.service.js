const dbAdapter = require('../adapters');

const getAll = async (includeDeleted = false) => {
    const query = includeDeleted ? {} : { deletedAt: null };
    return await dbAdapter.assetAdapter.getAll(query);
};

const getById = async (id) => {
    const asset = await dbAdapter.assetAdapter.getById(id);
    if (!asset) {
        throw new Error('Asset not found');
    }
    return asset;
};

const create = async (data, userId) => {
    const createdBy = userId;

    if (!data.name || data.name.trim() === '') {
        throw new Error('Asset name is required');
    }

    if (data.quantity === undefined || data.quantity === null || data.quantity < 0) {
        throw new Error('Asset quantity is required and must be a non-negative number');
    }

    return await dbAdapter.assetAdapter.create({
        name: data.name.trim(),
        quantity: data.quantity,
        createdBy: createdBy
    });
};

const update = async (id, data) => {
    const asset = await dbAdapter.assetAdapter.getById(id);
    if (!asset) {
        throw new Error('Asset not found');
    }

    const updateData = {};

    if (data.name !== undefined) {
        if (!data.name || data.name.trim() === '') {
            throw new Error('Asset name cannot be empty');
        }
        updateData.name = data.name.trim();
    }

    if (data.quantity !== undefined) {
        if (data.quantity === null || data.quantity < 0) {
            throw new Error('Asset quantity must be a non-negative number');
        }
        updateData.quantity = data.quantity;
    }

    return await dbAdapter.assetAdapter.update(id, updateData);
};

const remove = async (id) => {
    const asset = await dbAdapter.assetAdapter.getById(id);
    if (!asset) {
        throw new Error('Asset not found');
    }

    return await dbAdapter.assetAdapter.update(id, { deletedAt: new Date() });
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
}; 