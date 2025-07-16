const jwt = require('jsonwebtoken');

const dbAdapter = require('../adapters');

const getAllByUserId = async (userId, includeDeleted = false) => {
    const query = includeDeleted
        ? { buyersItBelongs: { $in: [userId] } }
        : { buyersItBelongs: { $in: [userId] }, deletedAt: null };

    // Fetch all clients with person relation
    const clients = await dbAdapter.clientAdapter.getAllWithRelations(query, ['person']);

    // Extract all unique buyer IDs
    const buyerIds = [...new Set(clients.flatMap(client => client.buyersItBelongs))];

    // Fetch all buyers in one call (avoiding multiple DB calls in a loop)
    const buyers = await dbAdapter.userAdapter.getAllWithRelations(
        { _id: { $in: buyerIds } },
        ['person']
    );

    // Create a lookup map for fast access
    const buyerMap = buyers.reduce((acc, buyer) => {
        acc[buyer.id] = {
            id: buyer.id,
            fullname: buyer.person ? `${buyer.person.names} ${buyer.person.lastNames}`.trim() : null
        };
        return acc;
    }, {});

    // Replace `buyersItBelongs` with enriched data
    return clients.map(client => ({
        ...client,
        buyersItBelongs: client.buyersItBelongs.map(buyerId => buyerMap[buyerId] || { id: buyerId, fullname: null })
    }));
};

const getAll = async (includeDeleted = false) => {
    const query = includeDeleted ? {} : { deletedAt: null };

    return await dbAdapter.clientAdapter.getAllWithRelations(query, ['person']);
};

const getById = async (id) => {
    const client = await dbAdapter.clientAdapter.getByIdWithRelations(id, ['person']);
    if (!client) {
        throw new Error('Client not found');
    }
    return client;
};

const create = async (data, userId) => {
    // Decode JWT Token
    const createdBy = userId; // Extract `id` from token

    if (!Array.isArray(data.buyersItBelongs) || data.buyersItBelongs.length === 0) {
        throw new Error('buyersItBelongs must be an array with at least one valid user');
    }

    // Validate that all buyer users exist
    const existingBuyers = await dbAdapter.userAdapter.getAll({ _id: { $in: data.buyersItBelongs } });
    if (existingBuyers.length !== data.buyersItBelongs.length) {
        throw new Error('One or more buyers in buyersItBelongs do not exist');
    }

    if (!data.person || typeof data.person !== 'object') {
        throw new Error('Person data is required and must be an object');
    }

    const person = await dbAdapter.personAdapter.create(data.person);

    return await dbAdapter.clientAdapter.create({
        person: person.id,
        buyersItBelongs: data.buyersItBelongs,
        createdBy: createdBy
    });
};

const update = async (id, data) => {
    const client = await dbAdapter.clientAdapter.getById(id);
    if (!client) {
        throw new Error('Client not found');
    }

    // 🔹 Update `person` if provided
    if (data.person) {
        await dbAdapter.personAdapter.update(client.person, data.person);
    }

    // 🔹 Check for `buyersItBelongs` updates
    if (data.buyersItBelongs) {
        if (!Array.isArray(data.buyersItBelongs) || data.buyersItBelongs.length === 0) {
            throw new Error('buyersItBelongs must be an array with at least one valid user');
        }

        // Convert arrays to Sets for easy comparison
        const existingBuyersSet = new Set(client.buyersItBelongs.map(b => b.toString())); // Existing buyers
        const newBuyersSet = new Set(data.buyersItBelongs.map(b => b.toString())); // Incoming buyers

        // 🔸 Find new buyers to ADD
        const buyersToAdd = [...newBuyersSet].filter(buyerId => !existingBuyersSet.has(buyerId));

        // 🔸 Find buyers to REMOVE
        const buyersToRemove = [...existingBuyersSet].filter(buyerId => !newBuyersSet.has(buyerId));

        // 🔹 Validate only the new buyers before adding
        if (buyersToAdd.length > 0) {
            const existingNewBuyers = await dbAdapter.userAdapter.getAll({ _id: { $in: buyersToAdd } });
            if (existingNewBuyers.length !== buyersToAdd.length) {
                throw new Error('One or more new buyers in buyersItBelongs do not exist');
            }
        }

        // 🔹 Update `buyersItBelongs` list
        data.buyersItBelongs = client.buyersItBelongs
            .filter(buyerId => !buyersToRemove.includes(buyerId.toString())) // Remove unwanted buyers
            .concat(buyersToAdd); // Add only new buyers
    }

    const updateData = { ...data };
    delete updateData.person; // Avoid modifying `person` separately

    return await dbAdapter.clientAdapter.update(id, updateData);
};



const remove = async (id) => {
    const client = await dbAdapter.clientAdapter.getById(id);
    if (!client) {
        throw new Error('Client not found');
    }

    return await dbAdapter.clientAdapter.update(id, { deletedAt: new Date() });
};

module.exports = {
    getAllByUserId,
    getAll,
    getById,
    create,
    update,
    remove
};
