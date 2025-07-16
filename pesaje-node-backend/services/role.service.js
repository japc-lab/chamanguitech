const dbAdapter = require('../adapters');

const getAll = async () => {
    return await dbAdapter.roleAdapter.getAll();
};

module.exports = {
    getAll,
};
