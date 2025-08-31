const dbAdapter = require('../adapters');
const PurchaseStatusEnum = require('../enums/purchase-status.enum');

const normalize = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const determinePaymentStatus = (totalPaid, totalAgreedToPay) => {
    if (totalPaid === 0) return PurchaseStatusEnum.CREATED;
    if (totalPaid >= totalAgreedToPay) return PurchaseStatusEnum.COMPLETED;
    return PurchaseStatusEnum.IN_PROGRESS;
};

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
        'localSellCompany',
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

    // Group payments by purchase id (normalize to string to avoid ObjectId vs string mismatches)
    const paymentsByPurchase = payments.reduce((acc, pm) => {
        const key = String(pm.purchase);
        if (!acc[key]) acc[key] = [];
        acc[key].push(pm);
        return acc;
    }, {});

    // Build final response
    return purchases.map(p => ({
        ...p,
        payments: paymentsByPurchase[String(p.id)] || [],
        paymentsCount: (paymentsByPurchase[String(p.id)]?.length || 0),
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

    const isDraft = data.status === PurchaseStatusEnum.DRAFT;

    // Validate references; for drafts, only validate provided ones; for non-drafts, enforce presence and validity
    await Promise.all(Object.entries(references).map(async ([key, adapter]) => {
        const id = data[key];
        if (id) {
            const entity = await dbAdapter[adapter].getById(id);
            if (!entity) {
                throw new Error(`${key.charAt(0).toUpperCase() + key.slice(1)} does not exist`);
            }
        } else if (!isDraft) {
            throw new Error(`${key.charAt(0).toUpperCase() + key.slice(1)} is required`);
        }
    }));

    // Conditionally validate period if present
    if (data.period) {
        const period = await dbAdapter.periodAdapter.getById(data.period);
        if (!period) {
            throw new Error('Period does not exist');
        }
    }

    // Set initial status to CREATED only when not provided; allow explicit DRAFT
    if (!data.status) {
        data.status = PurchaseStatusEnum.CREATED;
    }

    // Create the purchase record
    return await dbAdapter.purchaseAdapter.create(data);
};



const update = async (id, data) => {
    const transaction = await dbAdapter.purchaseAdapter.startTransaction();
    try {
        const purchase = await dbAdapter.purchaseAdapter.getById(id);
        if (!purchase) throw new Error('Purchase not found');

        // Update the purchase first
        await dbAdapter.purchaseAdapter.update(id, data, { session: transaction.session });

        // Recalculate status based on payments (unless explicitly setting to DRAFT or CONFIRMED/CLOSED)
        const shouldRecalculateStatus = !data.status || 
            (data.status !== PurchaseStatusEnum.DRAFT && 
             data.status !== PurchaseStatusEnum.CONFIRMED && 
             data.status !== PurchaseStatusEnum.CLOSED);

        if (shouldRecalculateStatus) {
            // Get all payments for this purchase
            const payments = await dbAdapter.purchasePaymentMethodAdapter.getAll({
                purchase: id,
                deletedAt: null
            });

            const totalPaid = normalize(payments.reduce((sum, pm) => sum + Number(pm.amount || 0), 0));
            const totalAgreedToPay = Number(data.totalAgreedToPay || purchase.totalAgreedToPay || 0);

            // Determine correct status based on payments
            const calculatedStatus = determinePaymentStatus(totalPaid, totalAgreedToPay);

            // Update with calculated status if different from current
            const updatedPurchase = await dbAdapter.purchaseAdapter.getById(id);
            if (updatedPurchase.status !== calculatedStatus) {
                await dbAdapter.purchaseAdapter.update(id, { status: calculatedStatus }, { session: transaction.session });
            }
        }

        await transaction.commit();
        return await dbAdapter.purchaseAdapter.getById(id);
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
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
