const dbAdapter = require('../adapters');

const getAll = async () => {

    return await dbAdapter.paymentMethodAdapter.getAll();
};

module.exports = {
    getAll,
};
