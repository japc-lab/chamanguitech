const dbAdapter = require('../adapters');
const { LogisticsTypeEnum, LogisticsStatusEnum } = require('../enums/logistics.enums');

// Helper function to determine logistics status based on payment statuses
const determineLogisticsStatus = (items) => {
    if (!items || items.length === 0) {
        return LogisticsStatusEnum.CREATED;
    }

    const paymentStatuses = items.map(item => item.payment?.paymentStatus).filter(Boolean);
    
    if (paymentStatuses.length === 0) {
        return LogisticsStatusEnum.CREATED;
    }

    // Check if all payments are PAID
    const allPaid = paymentStatuses.every(status => status === 'PAID');
    if (allPaid) {
        // Check if all payments are completed
        const allCompleted = items.every(item => item.payment?.isCompleted === true);
        if (allCompleted) {
            return LogisticsStatusEnum.CONFIRMED;
        }
        return LogisticsStatusEnum.COMPLETED;
    }

    // Check if any payment is PENDING
    const hasPending = paymentStatuses.some(status => status === 'PENDING');
    if (hasPending) {
        return LogisticsStatusEnum.IN_PROGRESS;
    }

    // Check if all payments are NO_PAYMENT
    const allNoPayment = paymentStatuses.every(status => status === 'NO_PAYMENT');
    if (allNoPayment) {
        return LogisticsStatusEnum.CREATED;
    }

    // Default case
    return LogisticsStatusEnum.IN_PROGRESS;
};

const create = async (data) => {
    const transaction = await dbAdapter.logisticsAdapter.startTransaction();
    try {
        const purchase = await dbAdapter.purchaseAdapter.getById(data.purchase);
        if (!purchase) {
            throw new Error('Purchase does not exist');
        }

        // Validate and create each LogisticsItem
        const createdItems = [];
        for (const item of data.items) {
            const createdItem = await dbAdapter.logisticsItemAdapter.create(item, { session: transaction.session });
            createdItems.push(createdItem.id);
        }

        // Determine logistics status based on payment statuses
        const logisticsStatus = determineLogisticsStatus(data.items);

        // Create the Logistics document
        const logistics = await dbAdapter.logisticsAdapter.create({
            purchase: data.purchase,
            type: data.type,
            logisticsDate: data.logisticsDate,
            grandTotal: data.grandTotal,
            logisticsSheetNumber: data.logisticsSheetNumber,
            status: logisticsStatus,
            items: createdItems
        }, { session: transaction.session });
        await transaction.commit();
        return logistics;

    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

const getAllByParams = async ({ userId, controlNumber, includeDeleted = false }) => {
    const logisticsQuery = includeDeleted ? {} : { deletedAt: null };

    const purchaseQuery = {};
    if (userId) purchaseQuery.buyer = userId;
    if (controlNumber) purchaseQuery.controlNumber = controlNumber;

    // Populate buyer, client, company
    const purchases = Object.keys(purchaseQuery).length > 0
        ? await dbAdapter.purchaseAdapter.getAllWithRelations(purchaseQuery, ['buyer', 'client', 'company'])
        : await dbAdapter.purchaseAdapter.getAllWithRelations({}, ['buyer', 'client', 'company']);

    const personIds = new Set();
    purchases.forEach(p => {
        if (p.buyer?.person) personIds.add(p.buyer.person);
        if (p.client?.person) personIds.add(p.client.person);
    });

    const persons = await dbAdapter.personAdapter.getAll({ _id: { $in: Array.from(personIds) } });
    const personMap = persons.reduce((map, person) => {
        map[person.id] = `${person.names} ${person.lastNames}`.trim();
        return map;
    }, {});

    const purchaseMap = purchases.reduce((acc, p) => {
        acc[p.id] = {
            controlNumber: p.controlNumber,
            weightSheetNumber: p.weightSheetNumber,
            companyName: p.company?.name || '',
            totalPounds: p.totalPounds || 0,
            buyer: p.buyer ? {
                id: p.buyer.id,
                fullName: personMap[p.buyer.person] || 'Desconocido'
            } : null,
            client: p.client ? {
                id: p.client.id,
                fullName: personMap[p.client.person] || 'Desconocido'
            } : null
        };
        return acc;
    }, {});

    const purchaseIds = purchases.map(p => p.id);
    if (Object.keys(purchaseQuery).length > 0 && purchaseIds.length === 0) return [];

    if (purchaseIds.length > 0) {
        logisticsQuery.purchase = { $in: purchaseIds };
    }

    const logistics = await dbAdapter.logisticsAdapter.getAllWithRelations(logisticsQuery, [
        { path: 'items', populate: { path: 'payment' } }
    ]);

    return logistics.map(log => {
        const purchaseInfo = purchaseMap[log.purchase];
        const controlNumber = purchaseInfo?.controlNumber || null;
        const companyName = purchaseInfo?.companyName || null;
        const totalPounds = purchaseInfo?.totalPounds || 0;

        // 🧠 Determine description
        let description = '';
        if (log.type === LogisticsTypeEnum.SHIPMENT) {
            description = companyName === 'Local' ? 'Envío Local' : 'Envío a Compañia';
        } else if (log.type === LogisticsTypeEnum.LOCAL_PROCESSING) {
            description = 'Procesamiento Local';
        }

        return {
            id: log.id,
            logisticsDate: log.logisticsDate,
            status: log.status || null,
            type: log.type,
            grandTotal: log.grandTotal,
            logisticsSheetNumber: log.logisticsSheetNumber,
            purchase: log.purchase, // still returning the ID
            totalPounds,
            items: log.items,
            controlNumber,
            description,
            buyer: purchaseInfo?.buyer || null,
            client: purchaseInfo?.client || null,
            deletedAt: log.deletedAt || null,
        };
    });
};


const getById = async (id) => {
    const logistics = await dbAdapter.logisticsAdapter.getByIdWithRelations(id, [
        {
            path: 'items',
            populate: { path: 'payment' }
        },
        {
            path: 'purchase',
            populate: [
                { path: 'buyer', populate: { path: 'person' } },
                { path: 'broker', populate: { path: 'person' } },
                { path: 'client', populate: { path: 'person' } },
                { path: 'company' },
                { path: 'shrimpFarm' }
            ]
        }
    ]);

    if (!logistics) throw new Error('Logistics not found');

    const { purchase, items, ...rest } = logistics;

    const formatPerson = (user) => user?.person
        ? { id: user._id, fullName: `${user.person.names} ${user.person.lastNames}`.trim() }
        : { id: user?._id || null, fullName: null };

    return {
        ...rest,
        purchase: {
            id: purchase.id,
            controlNumber: purchase.controlNumber,
            purchaseDate: purchase.purchaseDate,
            weightSheetNumber: purchase.weightSheetNumber,
            buyer: formatPerson(purchase.buyer),
            broker: formatPerson(purchase.broker),
            client: formatPerson(purchase.client),
            company: purchase.company
                ? { id: purchase.company._id, name: purchase.company.name }
                : null,
            shrimpFarm: purchase.shrimpFarm
                ? {
                    id: purchase.shrimpFarm._id,
                    identifier: purchase.shrimpFarm.identifier,
                    place: purchase.shrimpFarm.place
                }
                : null
        },
        items: items
    };
};


const update = async (id, data) => {
    const transaction = await dbAdapter.logisticsAdapter.startTransaction();
    try {
        const existingLogistics = await dbAdapter.logisticsAdapter.getById(id);
        if (!existingLogistics) {
            throw new Error('Logistics record not found');
        }

        // 🔥 Real deletion of each LogisticsItem using removePermanently
        for (const itemId of existingLogistics.items) {
            await dbAdapter.logisticsItemAdapter.removePermanently(itemId);
        }

        // 🔁 Create new LogisticsItems
        const newItemIds = [];
        for (const item of data.items) {
            const newItem = await dbAdapter.logisticsItemAdapter.create(item, { session: transaction.session });
            newItemIds.push(newItem.id);
        }

        // Determine logistics status based on payment statuses
        const logisticsStatus = determineLogisticsStatus(data.items);

        // ✏️ Update Logistics record
        const updatedLogistics = await dbAdapter.logisticsAdapter.update(
            id,
            {
                logisticsDate: data.logisticsDate,
                grandTotal: data.grandTotal,
                logisticsSheetNumber: data.logisticsSheetNumber,
                status: logisticsStatus,
                items: newItemIds
            },
            { session: transaction.session }
        );

        await transaction.commit();
        return updatedLogistics;
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};



const remove = async (id) => {
    const logistics = await dbAdapter.logisticsAdapter.getById(id);
    if (!logistics) throw new Error('Logistics not found');
    return await dbAdapter.logisticsAdapter.update(id, { deletedAt: new Date() });
};

module.exports = {
    create,
    getAllByParams,
    getById,
    update,
    remove
};
