const dbAdapter = require('../adapters');

const getAll = async (includeDeleted = false) => {
    const query = includeDeleted ? {} : { deletedAt: null };
    return await dbAdapter.shrimpFarmAdapter.getAll(query);
};

const getAllByClientIdAndUserId = async (clientId, userId = null, includeDeleted = false) => {
    const query = includeDeleted ? { client: clientId } : { client: clientId, deletedAt: null };

    if (userId) {
        query.buyerItBelongs = userId;
    }

    return await dbAdapter.shrimpFarmAdapter.getAll(query);
};


const getById = async (id) => {
    const shrimpFarm = await dbAdapter.shrimpFarmAdapter.getById(id);
    if (!shrimpFarm) {
        throw new Error('Shrimp farm not found');
    }
    return shrimpFarm;
};

const create = async (data) => {
    const clientExists = await dbAdapter.clientAdapter.getById(data.client);
    if (!clientExists) {
        throw new Error('Client does not exist');
    }

    return await dbAdapter.shrimpFarmAdapter.create(data);
};

const update = async (id, data) => {
    const shrimpFarm = await dbAdapter.shrimpFarmAdapter.getById(id);
    if (!shrimpFarm) {
        throw new Error('Shrimp farm not found');
    }

    return await dbAdapter.shrimpFarmAdapter.update(id, data);
};

const remove = async (id) => {
    const shrimpFarm = await dbAdapter.shrimpFarmAdapter.getById(id);
    if (!shrimpFarm) {
        throw new Error('Shrimp farm not found');
    }

    return await dbAdapter.shrimpFarmAdapter.update(id, { deletedAt: new Date() });
};

module.exports = {
    getAll,
    getAllByClientIdAndUserId,
    getById,
    create,
    update,
    remove
};
