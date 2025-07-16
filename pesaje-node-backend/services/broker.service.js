const dbAdapter = require('../adapters');

const getAllByUserId = async (userId, includeDeleted = false) => {
    const query = includeDeleted ? { buyerItBelongs: userId } : { buyerItBelongs: userId, deletedAt: null };

    // Fetch brokers with `person` relation
    const brokers = await dbAdapter.brokerAdapter.getAllWithRelations(query, ['person']);

    // Extract unique `buyerItBelongs` user IDs to minimize queries
    const buyerUserIds = [...new Set(brokers.map(b => b.buyerItBelongs).filter(Boolean))];

    // Fetch all buyer users and their person details in a single query
    const buyerUsers = await dbAdapter.userAdapter.getAllWithRelations({ _id: { $in: buyerUserIds } }, ['person']);

    // Create a lookup map for `buyerItBelongs`
    const buyerMap = buyerUsers.reduce((acc, user) => {
        acc[user.id] = {
            id: user.id,
            fullName: user.person ? `${user.person.names} ${user.person.lastNames}`.trim() : 'Unknown'
        };
        return acc;
    }, {});

    // Map brokers, enriching `buyerItBelongs`
    return brokers.map(({ person, buyerItBelongs, ...brokerObject }) => ({
        ...brokerObject,
        person,
        buyerItBelongs: buyerItBelongs ? buyerMap[buyerItBelongs] || null : null // Assign from lookup
    }));
};

const getAll = async (includeDeleted = false) => {
    const query = includeDeleted ? {} : { deletedAt: null };

    // Fetch all brokers with `person` relation
    const brokers = await dbAdapter.brokerAdapter.getAllWithRelations(query, ['person']);

    // Extract unique `buyerItBelongs` user IDs to minimize queries
    const buyerUserIds = [...new Set(brokers.map(b => b.buyerItBelongs).filter(Boolean))];

    // Fetch all buyer users and their person details in a single query
    const buyerUsers = await dbAdapter.userAdapter.getAllWithRelations({ _id: { $in: buyerUserIds } }, ['person']);

    // Create a lookup map for `buyerItBelongs`
    const buyerMap = buyerUsers.reduce((acc, user) => {
        acc[user.id] = {
            id: user.id,
            fullName: user.person ? `${user.person.names} ${user.person.lastNames}`.trim() : 'Unknown'
        };
        return acc;
    }, {});

    // Map brokers, enriching `buyerItBelongs`
    return brokers.map(({ person, buyerItBelongs, ...brokerObject }) => ({
        ...brokerObject,
        person,
        buyerItBelongs: buyerItBelongs ? buyerMap[buyerItBelongs] || null : null // Assign from lookup
    }));
};



const getById = async (id) => {
    const broker = await dbAdapter.brokerAdapter.getByIdWithRelations(id, ['person']);

    if (!broker) {
        throw new Error('Broker not found');
    }

    const { person, ...brokerObject } = broker;
    brokerObject.person = person;

    return brokerObject;
};

const create = async (data) => {
    // Ensure the buyer exists in the database
    const userExists = await dbAdapter.userAdapter.getById(data.buyerItBelongs);
    if (!userExists) {
        throw new Error('Buyer (buyerItBelongs) does not exist');
    }

    if (!data.person || typeof data.person !== 'object') {
        throw new Error('Person data is required and must be an object');
    }

    // Create the Person document first
    const person = await dbAdapter.personAdapter.create(data.person);

    // Now create the Broker referencing the created Person
    return await dbAdapter.brokerAdapter.create({
        person: person.id, // Reference the newly created Person
        buyerItBelongs: data.buyerItBelongs
    });
};

const update = async (id, data) => {
    const broker = await dbAdapter.brokerAdapter.getById(id);
    if (!broker) {
        throw new Error('Broker not found');
    }

    // If person data is included, update the referenced Person document
    if (data.person) {
        await dbAdapter.personAdapter.update(broker.person, data.person);
    }

    // Prevent updating `buyerItBelongs`
    const updateData = { ...data };
    delete updateData.person;

    return await dbAdapter.brokerAdapter.update(id, updateData);
};

const remove = async (id) => {
    const broker = await dbAdapter.brokerAdapter.getById(id);
    if (!broker) {
        throw new Error('Broker not found');
    }

    return await dbAdapter.brokerAdapter.update(id, { deletedAt: new Date() });
};

module.exports = {
    getAllByUserId,
    getAll,
    getById,
    create,
    update,
    remove
};
