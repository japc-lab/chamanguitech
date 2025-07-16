const dbAdapter = require('../adapters');

const getAll = async (includeDeleted = false) => {
    // Use includeDeleted to filter out soft-deleted companies
    const query = includeDeleted ? {} : { deletedAt: null };
    const companies = await dbAdapter.companyAdapter.getAll(query);
    // Sort: numeric codes first, then non-numeric/missing codes at the end
    companies.sort((a, b) => {
        const codeA = parseInt(a.code, 10);
        const codeB = parseInt(b.code, 10);
        const isNumA = !isNaN(codeA);
        const isNumB = !isNaN(codeB);

        if (isNumA && isNumB) {
            return codeA - codeB;
        }
        if (isNumA) return -1;
        if (isNumB) return 1;
        // Both are not numbers, keep original order or sort alphabetically if you want
        return 0;
    });
    return companies;
};

const getById = async (id) => {
    return await dbAdapter.companyAdapter.getById(id);
};

const create = async (data) => {
    return await dbAdapter.companyAdapter.create(data);
};

const update = async (id, data) => {
    const company = await dbAdapter.companyAdapter.getById(id);
    if (!company) {
        throw new Error('Company not found');
    }
    if (data.code) {
        // Check if another company already has this code
        const existing = await dbAdapter.companyAdapter.getAll({ code: data.code });
        // Allow update if the existing company with this code is the same as the one being updated
        if (existing.length && String(existing[0].id) !== String(id)) {
            throw new Error('Company code already exists');
        }
        // If existing[0].id === id, allow update to continue
    }
    return await dbAdapter.companyAdapter.update(id, data);
};


const remove = async (id) => {
    const company = await dbAdapter.companyAdapter.getById(id);
    if (!company) {
        throw new Error('Company not found');
    }
    // Soft delete: set deletedAt timestamp and remove code
    return await dbAdapter.companyAdapter.update(id, { deletedAt: new Date(), code: null });
};



module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
};
