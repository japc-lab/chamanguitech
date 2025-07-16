const dbAdapter = require('../adapters');

const getById = async (id) => {
    // Find the period by id
    const period = await dbAdapter.periodAdapter.getById(id);

    // Fetch all related `sizePrices` for the found period
    const sizePrices = await dbAdapter.sizePriceAdapter.getAllWithRelations(
        { period: period.id },
        ['size']
    );

    // Group by size.type
    const typeGroups = {};
    sizePrices.forEach(sp => {
        const type = sp.size.type || '';
        if (!typeGroups[type]) typeGroups[type] = [];
        typeGroups[type].push(sp);
    });

    // Sort each group by size string
    Object.values(typeGroups).forEach(group => {
        group.sort((a, b) => {
            const sizeA = a.size.size.split('/').map(Number);
            const sizeB = b.size.size.split('/').map(Number);
            const isNumA = sizeA.every(n => !isNaN(n));
            const isNumB = sizeB.every(n => !isNaN(n));

            if (isNumA && isNumB) {
                return sizeA[0] - sizeB[0] || sizeA[1] - sizeB[1];
            }
            if (isNumA) return -1;
            if (isNumB) return 1;
            // Both are not numbers, sort alphabetically
            return a.size.size.localeCompare(b.size.size);
        });
    });

    // Flatten back to a single array, preserving type group order
    const sortedSizePrices = Object.values(typeGroups).flat();

    return { ...period, sizePrices: sortedSizePrices };
};

const getAllByCompany = async (companyId) => {
    if (!companyId) {
        throw new Error('CompanyId is required');
    }

    // Find the periods by company
    const periods = await dbAdapter.periodAdapter.getAll({ company: companyId });

    // Sort periods by name (MM-YYYY)
    periods.sort((a, b) => {
        const [monthA, yearA] = a.name.split('-').map(Number);
        const [monthB, yearB] = b.name.split('-').map(Number);

        return yearA - yearB || monthA - monthB; // Sort by year first, then month
    });

    return periods;
};

const getAllDistinctPeriodNamesSorted = async () => {
    // Get all periods
    const periods = await dbAdapter.periodAdapter.getAll({});
    // Extract unique names
    const uniqueNames = [...new Set(periods.map(p => p.name))];
    // Sort by year, then month (names are in format number/year)
    uniqueNames.sort((a, b) => {
        const [monthA, yearA] = a.split('/').map(Number);
        const [monthB, yearB] = b.split('/').map(Number);
        return yearA - yearB || monthA - monthB;
    });
    return uniqueNames;
};

const create = async (data) => {
    // ✅ Validate `sizePrices` BEFORE starting the transaction
    if (data.sizePrices && !Array.isArray(data.sizePrices)) {
        throw new Error('sizePrices must be an array');
    }

    // Extract size IDs from the request
    const sizeIds = data.sizePrices ? data.sizePrices.map(sp => sp.sizeId) : [];

    // Validate all sizes exist
    if (sizeIds.length > 0) {
        const existingSizes = await dbAdapter.sizeAdapter.getAll({ _id: { $in: sizeIds } });

        if (existingSizes.length !== sizeIds.length) {
            throw new Error('One or more sizes do not exist');
        }
    }

    // ✅ Ensure `sizePrices` contain valid `sizeId` & `price` before transaction
    if (data.sizePrices) {
        for (const sp of data.sizePrices) {
            if (!sp.sizeId || typeof sp.price !== 'number') {
                throw new Error(`Missing or invalid price for sizeId: ${sp.sizeId || 'unknown'}`);
            }
        }
    }

    // ✅ Now start the transaction
    const transaction = await dbAdapter.periodAdapter.startTransaction();
    const session = transaction.session;

    try {
        // ✅ Check if the period already exists
        const existingPeriod = await dbAdapter.periodAdapter.getAll(
            { name: data.name, company: data.company },
            { session }
        );

        if (existingPeriod.length > 0) {
            throw new Error(`A period with the name "${data.name}" already exists for this company.`);
        }

        // ✅ Validate company exists
        const companyExists = await dbAdapter.companyAdapter.getById(data.company, { session });
        if (!companyExists) {
            throw new Error('Company does not exist');
        }

        // ✅ Create the Period only after validation
        const period = await dbAdapter.periodAdapter.create(
            { name: data.name, receivedDateTime: data.receivedDateTime, company: data.company, fromDate: data.fromDate, toDate: data.toDate, timeOfDay: data.timeOfDay },
            { session }
        );

        // ✅ Create SizePrice records
        let sizePrices = [];
        if (data.sizePrices) {
            sizePrices = await Promise.all(
                data.sizePrices.map(async (sp) => {
                    return dbAdapter.sizePriceAdapter.create(
                        { size: sp.sizeId, price: sp.price, period: period.id },
                        { session }
                    );
                })
            );
        }

        // ✅ Commit transaction (Save everything if successful)
        await transaction.commit();
        transaction.end();

        return { ...period, sizePrices };
    } catch (error) {
        await transaction.rollback(); // Rollback changes if anything fails
        transaction.end();
        throw new Error(error.message); // Ensure error is thrown back to API
    }
};

const update = async (periodId, data) => {
    const { receivedDateTime, sizePrices, fromDate, toDate, timeOfDay } = data;

    // Find the period
    const period = await dbAdapter.periodAdapter.getById(periodId);
    if (!period) {
        throw new Error('Period not found');
    }

    // Validate receivedDateTime format (if provided)
    if (receivedDateTime && isNaN(Date.parse(receivedDateTime))) {
        throw new Error('Invalid receivedDateTime format. Use ISO 8601 format.');
    }

    // Validate receivedDateTime format (if provided)
    if (fromDate && isNaN(Date.parse(fromDate))) {
        throw new Error('Invalid fromDate format. Use ISO 8601 format.');
    }

    // Validate that sizePrices is provided and not empty
    if (!sizePrices || sizePrices.length === 0) {
        throw new Error('sizePrices must be provided and cannot be empty.');
    }

    // Validate that all `sizeId`s exist
    const sizeIds = sizePrices.map(sp => sp.sizeId);
    const existingSizes = await dbAdapter.sizeAdapter.getAll({ _id: { $in: sizeIds } });

    if (existingSizes.length !== sizeIds.length) {
        throw new Error('One or more sizeIds provided do not exist. No updates were performed.');
    }

    // Start transaction using the dbAdapter method
    const transaction = await dbAdapter.periodAdapter.startTransaction();

    try {
        if (receivedDateTime) {
            await dbAdapter.periodAdapter.update(periodId, { receivedDateTime, fromDate, toDate, timeOfDay }, { session: transaction.session });
        }

        for (let sp of sizePrices) {
            const existingSizePrice = await dbAdapter.sizePriceAdapter.getAll({
                size: sp.sizeId,
                period: period.id
            });

            if (existingSizePrice.length > 0) {
                // Update existing sizePrice
                await dbAdapter.sizePriceAdapter.update(existingSizePrice[0].id, { price: sp.price }, { session: transaction.session });
            } else {
                // Create new sizePrice if it doesn't exist
                await dbAdapter.sizePriceAdapter.create({
                    size: sp.sizeId,
                    price: sp.price,
                    period: period.id
                }, { session: transaction.session });
            }
        }

        // Commit transaction if everything succeeds
        await transaction.commit();
        transaction.end();

        return { ...period, receivedDateTime, sizePrices };
    } catch (error) {
        await transaction.rollback();
        await transaction.end();
        throw new Error(`Update failed: ${error.message}`);
    }
};

const remove = async (id) => {
    const period = await dbAdapter.periodAdapter.getById(id);
    if (!period) {
        throw new Error('Period not found');
    }

    // Soft delete the Period
    await dbAdapter.periodAdapter.update(id, { deletedAt: new Date() });

    return { message: 'Period deleted successfully' };
};

/**
 * Returns prices grouped by Size type, then for each type a list of companies with their sizes and prices for that type.
 * Output: [{ type, companies: [{ company: {id, name}, sizePrices: [{ size: {id, name}, price }] }] }]
 */
const getPricesForCompanyByPeriodName = async (periodName) => {
    // Get all periods with the given name
    const periods = await dbAdapter.periodAdapter.getAll({ name: periodName });
    if (!periods.length) return [];

    // Get all companies referenced by these periods
    const companyIds = periods.map(p => p.company);
    const companies = await dbAdapter.companyAdapter.getAll({ _id: { $in: companyIds } });
    const companyMap = {};
    companies.forEach(c => { companyMap[String(c.id)] = c; });

    // For each period, get its sizePrices (with size populated, including type)
    const allCompanySizePrices = await Promise.all(periods.map(async period => {
        const sizePrices = await dbAdapter.sizePriceAdapter.getAllWithRelations(
            { period: period.id },
            ['size']
        );

        // Group by size.type
        const typeGroups = {};
        sizePrices.forEach(sp => {
            const type = sp.size.type || '';
            if (!typeGroups[type]) typeGroups[type] = [];
            typeGroups[type].push(sp);
        });

        // Sort each group by size string
        Object.values(typeGroups).forEach(group => {
            group.sort((a, b) => {
                const sizeA = a.size.size.split('/').map(Number);
                const sizeB = b.size.size.split('/').map(Number);
                const isNumA = sizeA.every(n => !isNaN(n));
                const isNumB = sizeB.every(n => !isNaN(n));

                if (isNumA && isNumB) {
                    return sizeA[0] - sizeB[0] || sizeA[1] - sizeB[1];
                }
                if (isNumA) return -1;
                if (isNumB) return 1;
                // Both are not numbers, sort alphabetically
                return a.size.size.localeCompare(b.size.size);
            });
        });

        // Flatten back to a single array, preserving type group order
        const sortedSizePrices = Object.values(typeGroups).flat();

        return {
            company: companyMap[String(period.company)]
                ? { id: companyMap[String(period.company)].id, name: companyMap[String(period.company)].name }
                : { id: period.company, name: 'Unknown' },
            sizePrices: sortedSizePrices
                .filter(sp => sp.size && sp.size.type)
                .map(sp => ({
                    type: sp.size.type,
                    size: {
                        id: sp.size.id,
                        name: sp.size.name,
                        size: sp.size.size // add the size string property
                    },
                    price: sp.price
                }))
        };
    }));

    // Group by type
    const typeMap = {};
    allCompanySizePrices.forEach(companyEntry => {
        companyEntry.sizePrices.forEach(sp => {
            if (!typeMap[sp.type]) {
                typeMap[sp.type] = [];
            }
            // Find or create company entry for this type
            let companyGroup = typeMap[sp.type].find(c => c.company.id === companyEntry.company.id);
            if (!companyGroup) {
                companyGroup = { company: companyEntry.company, sizePrices: [] };
                typeMap[sp.type].push(companyGroup);
            }
            companyGroup.sizePrices.push({ size: sp.size, price: sp.price });
        });
    });

    // For each type group, for each size, find the highest price and mark it
    Object.values(typeMap).forEach(companies => {
        // Collect all sizes for this type
        const sizeMap = {};
        companies.forEach(companyGroup => {
            companyGroup.sizePrices.forEach(sp => {
                const sizeKey = sp.size.id;
                if (!sizeMap[sizeKey]) sizeMap[sizeKey] = [];
                sizeMap[sizeKey].push({ companyGroup, sp });
            });
        });
        // For each size, find the max price and set a flag
        Object.values(sizeMap).forEach(entries => {
            const maxPrice = Math.max(...entries.map(e => e.sp.price));
            entries.forEach(e => {
                if (e.sp.price === maxPrice) {
                    e.sp.highest = true;
                } else {
                    e.sp.highest = false;
                }
            });
        });
    });

    // Convert to array format
    const result = Object.entries(typeMap).map(([type, companies]) => ({
        type,
        companies
    }));

    return result;
};

module.exports = {
    getById,
    getAllByCompany,
    create,
    update,
    remove,
    getAllDistinctPeriodNamesSorted,
    getPricesForCompanyByPeriodName
};
