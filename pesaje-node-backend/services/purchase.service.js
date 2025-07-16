const dbAdapter = require('../adapters');
const PurchaseStatusEnum = require('../enums/purchase-status.enum');

const getAllByParams = async ({ includeDeleted = false, clientId, userId, companyId, periodId, controlNumber }) => {
    // Build base query
    const query = includeDeleted ? {} : { deletedAt: null };
    if (clientId) query.client = clientId;
    if (userId) query.buyer = userId;
    if (companyId) query.company = companyId;
    if (periodId) query.period = periodId;
    if (controlNumber) query.controlNumber = controlNumber;

    // Fetch purchases with relations
    const purchases = await dbAdapter.purchaseAdapter.getAllWithRelations(query, [
        'buyer',
        'broker',
        'client',
        'shrimpFarm',
        'company',
        'period',
    ]);

    // Collect person IDs from buyer, broker, client
    const personIds = new Set();
    purchases.forEach(p => {
        if (p.buyer?.person) personIds.add(p.buyer.person);
        if (p.broker?.person) personIds.add(p.broker.person);
        if (p.client?.person) personIds.add(p.client.person);
    });

    // Fetch person docs
    const persons = await dbAdapter.personAdapter.getAll({ _id: { $in: Array.from(personIds) } });
    const personMap = persons.reduce((map, p) => {
        map[p.id] = `${p.names} ${p.lastNames}`.trim();
        return map;
    }, {});

    // Fetch payments
    const purchaseIds = purchases.map(p => p.id);
    const payments = await dbAdapter.purchasePaymentMethodAdapter.getAll({
        purchase: { $in: purchaseIds },
        deletedAt: null,
    });
    const paymentMap = payments.reduce((map, p) => {
        map[p.purchase] = (map[p.purchase] || 0) + p.amount;
        return map;
    }, {});

    // Build final response
    return purchases.map(p => ({
        ...p,
        totalPaid: paymentMap[p.id] || 0,
        buyer: p.buyer ? {
            id: p.buyer.id,
            fullName: personMap[p.buyer.person] || 'Unknown'
        } : null,
        broker: p.broker ? {
            id: p.broker.id,
            fullName: personMap[p.broker.person] || 'Unknown'
        } : null,
        client: p.client ? {
            id: p.client.id,
            fullName: personMap[p.client.person] || 'Unknown'
        } : null,
        shrimpFarm: p.shrimpFarm ? {
            id: p.shrimpFarm.id,
            identifier: p.shrimpFarm.identifier,
            place: p.shrimpFarm.place,
            transportationMethod: p.shrimpFarm.transportationMethod
        } : null,
        period: p.period ? {
            id: p.period.id,
            name: p.period.name
        } : null
    }));
};


const getById = async (id) => {
    const purchase = await dbAdapter.purchaseAdapter.getByIdWithRelations(id, [
        // 'buyer',
        // 'company',
        // 'broker',
        // 'client',
        // 'shrimpFarm',
    ]);

    // Remove `buyer.password` if it exists
    // if (purchase && purchase.buyer) {
    //     purchase.buyer = {
    //         ...purchase.buyer,
    //         password: undefined, // Remove password field
    //     };
    // }

    return purchase;
};


const create = async (data) => {
    // Define the references and their corresponding adapters
    const references = {
        buyer: 'userAdapter',
        company: 'companyAdapter',
        broker: 'brokerAdapter',
        client: 'clientAdapter',
        shrimpFarm: 'shrimpFarmAdapter'
    };

    // Always validate required references
    await Promise.all(Object.entries(references).map(async ([key, adapter]) => {
        const entity = await dbAdapter[adapter].getById(data[key]);
        if (!entity) {
            throw new Error(`${key.charAt(0).toUpperCase() + key.slice(1)} does not exist`);
        }
    }));

    // Conditionally validate period if present
    if (data.period) {
        const period = await dbAdapter.periodAdapter.getById(data.period);
        if (!period) {
            throw new Error('Period does not exist');
        }
    }

    // Set initial status
    data.status = PurchaseStatusEnum.DRAFT;

    // Create the purchase record
    return await dbAdapter.purchaseAdapter.create(data);
};



const update = async (id, data) => {
    const purchase = await dbAdapter.purchaseAdapter.getById(id);
    if (!purchase) throw new Error('Purchase not found');

    return await dbAdapter.purchaseAdapter.update(id, data);
};

const remove = async (id) => {
    const transaction = await dbAdapter.purchaseAdapter.startTransaction();

    try {
        const purchase = await dbAdapter.purchaseAdapter.getById(id);
        if (!purchase) throw new Error('Purchase not found');

        const now = new Date();

        // 🧾 Soft-delete the purchase
        await dbAdapter.purchaseAdapter.update(id, { deletedAt: now }, { session: transaction.session });

        // 🚛 Soft-delete related logistics
        const logistics = await dbAdapter.logisticsAdapter.getAll({ purchase: id });
        await Promise.all(
            logistics.map(log =>
                dbAdapter.logisticsAdapter.update(log.id, { deletedAt: now }, { session: transaction.session })
            )
        );

        // 💰 Soft-delete related sales and their respective type
        const sales = await dbAdapter.saleAdapter.getAll({ purchase: id });
        await Promise.all(
            sales.map(async (sale) => {
                await dbAdapter.saleAdapter.update(sale.id, { deletedAt: now }, { session: transaction.session });

                // 🏢 Soft-delete associated company sale (if any)
                const companySales = await dbAdapter.companySaleAdapter.getAll({ sale: sale.id });
                await Promise.all(
                    companySales.map(cs =>
                        dbAdapter.companySaleAdapter.update(cs.id, { deletedAt: now }, { session: transaction.session })
                    )
                );

                // 🏪 Soft-delete associated local sale (if any)
                const localSales = await dbAdapter.localSaleAdapter.getAll({ sale: sale.id });
                await Promise.all(
                    localSales.map(ls =>
                        dbAdapter.localSaleAdapter.update(ls.id, { deletedAt: now }, { session: transaction.session })
                    )
                );
            })
        );

        await transaction.commit();
        return { id, deletedAt: now };
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

module.exports = {
    getAllByParams,
    getById,
    create,
    update,
    remove
};
