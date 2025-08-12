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

    // Create asset with all properties from data, plus createdBy
    return await dbAdapter.assetAdapter.create({
        ...data
    });
};

const update = async (id, data) => {
    const asset = await dbAdapter.assetAdapter.getById(id);
    if (!asset) {
        throw new Error('Asset not found');
    }

    const updateData = { ...data };

    // Handle deletedAt separately if provided
    if (data.deletedAt !== undefined) {
        updateData.deletedAt = data.deletedAt;
    }

    // Update with all provided data
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