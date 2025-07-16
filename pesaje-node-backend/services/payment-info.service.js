const dbAdapter = require('../adapters');

const create = async (data) => {
    const { personId, ...paymentData } = data;

    // Validate that `personId` is provided
    if (!personId) {
        throw new Error('Person ID is required');
    }

    // Check if the `Person` exists in the database
    const person = await dbAdapter.personAdapter.getById(personId);
    if (!person) {
        throw new Error('Person not found');
    }

    // Attach `person` to the payment info data
    const paymentInfoData = {
        ...paymentData,
        person: personId
    };

    return await dbAdapter.paymentInfoAdapter.create(paymentInfoData);
};


const getAll = async (personId, includeDeleted = false) => {
    const query = includeDeleted ? {} : { deletedAt: null };

    if (personId) {
        // Check if the person exists in the database
        const person = await dbAdapter.personAdapter.getById(personId);
        if (!person) {
            throw new Error('Person not found');
        }
        query.person = personId; // Filter by personId
    }

    return await dbAdapter.paymentInfoAdapter.getAll(query);
};



const getById = async (id) => {
    return await dbAdapter.paymentInfoAdapter.getById(id);
};

const update = async (id, data) => {
    delete data.personId; // Ensure `personId` is not updated

    const updatedPaymentInfo = await dbAdapter.paymentInfoAdapter.update(id, data);
    if (!updatedPaymentInfo) {
        throw new Error('Payment info not found');
    }

    return updatedPaymentInfo;
};


const remove = async (id) => {
    const paymentInfo = await dbAdapter.paymentInfoAdapter.getById(id);
    if (!paymentInfo) {
        throw new Error('PaymentInfo not found');
    }

    return await dbAdapter.paymentInfoAdapter.update(id, { deletedAt: new Date() });
};


module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
};