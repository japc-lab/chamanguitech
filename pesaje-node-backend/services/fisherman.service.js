const dbAdapter = require('../adapters');

const getAll = async (includeDeleted = false) => {
    const query = includeDeleted ? {} : { deletedAt: null };

    // Fetch all fishermen with `person` relation
    const fishermen = await dbAdapter.fishermanAdapter.getAllWithRelations(query, ['person']);

    return fishermen;
};

const getById = async (id) => {
    const fisherman = await dbAdapter.fishermanAdapter.getByIdWithRelations(id, ['person']);

    if (!fisherman) {
        throw new Error('Fisherman not found');
    }

    return fisherman;
};

const create = async (data) => {
    if (!data.person || typeof data.person !== 'object') {
        throw new Error('Person data is required and must be an object');
    }

    // Create the Person document first
    const person = await dbAdapter.personAdapter.create(data.person);

    // Now create the Fisherman referencing the created Person
    return await dbAdapter.fishermanAdapter.create({
        person: person.id // Reference the newly created Person
    });
};

const update = async (id, data) => {
    const fisherman = await dbAdapter.fishermanAdapter.getById(id);
    if (!fisherman) {
        throw new Error('Fisherman not found');
    }

    // If person data is included, update the referenced Person document
    if (data.person) {
        await dbAdapter.personAdapter.update(fisherman.person, data.person);
    }

    // Remove person from update data since it's handled separately
    const updateData = { ...data };
    delete updateData.person;

    return await dbAdapter.fishermanAdapter.update(id, updateData);
};

const remove = async (id) => {
    const fisherman = await dbAdapter.fishermanAdapter.getById(id);
    if (!fisherman) {
        throw new Error('Fisherman not found');
    }

    return await dbAdapter.fishermanAdapter.update(id, { deletedAt: new Date() });
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
}; 