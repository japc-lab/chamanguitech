const dbAdapter = require('../adapters');

const getAll = async (includeDeleted = false) => {
    const query = includeDeleted ? {} : { deletedAt: null };

    // Fetch all merchants with `person` relation
    const merchants = await dbAdapter.merchantAdapter.getAllWithRelations(query, ['person']);

    return merchants;
};

const getById = async (id) => {
    const merchant = await dbAdapter.merchantAdapter.getByIdWithRelations(id, ['person']);

    if (!merchant) {
        throw new Error('Merchant not found');
    }

    return merchant;
};

const create = async (data) => {
    if (!data.person || typeof data.person !== 'object') {
        throw new Error('Person data is required and must be an object');
    }

    // Create the Person document first
    const person = await dbAdapter.personAdapter.create(data.person);

    // Now create the Merchant referencing the created Person
    return await dbAdapter.merchantAdapter.create({
        person: person.id // Reference the newly created Person
    });
};

const update = async (id, data) => {
    const merchant = await dbAdapter.merchantAdapter.getById(id);
    if (!merchant) {
        throw new Error('Merchant not found');
    }

    // If person data is included, update the referenced Person document
    if (data.person) {
        await dbAdapter.personAdapter.update(merchant.person, data.person);
    }

    // Remove person from update data since it's handled separately
    const updateData = { ...data };
    delete updateData.person;

    return await dbAdapter.merchantAdapter.update(id, updateData);
};

const remove = async (id) => {
    const merchant = await dbAdapter.merchantAdapter.getById(id);
    if (!merchant) {
        throw new Error('Merchant not found');
    }

    return await dbAdapter.merchantAdapter.update(id, { deletedAt: new Date() });
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
}; 