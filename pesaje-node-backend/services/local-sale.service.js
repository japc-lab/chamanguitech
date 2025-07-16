const dbAdapter = require('../adapters');
const SaleTypeEnum = require('../enums/sale-type.enum');

const create = async (data) => {
    const transaction = await dbAdapter.localSaleAdapter.startTransaction();

    try {
        const {
            purchase,
            saleDate,
            wholeTotalPounds,
            tailTotalPounds,
            wholeRejectedPounds,
            trashPounds,
            totalProcessedPounds,
            grandTotal,
            seller,
            details
        } = data;

        // 🔍 Validate referenced Purchase
        const purchaseExists = await dbAdapter.purchaseAdapter.getById(purchase);
        if (!purchaseExists) throw new Error('Purchase does not exist');

        // 📦 Create Sale document
        const sale = await dbAdapter.saleAdapter.create({
            purchase,
            saleDate,
            type: SaleTypeEnum.LOCAL
        }, { session: transaction.session });

        const detailIds = [];

        for (const detail of details) {
            const itemIds = [];

            for (const item of detail.items) {
                const createdItem = await dbAdapter.localSaleDetailItemAdapter.create(item, { session: transaction.session });
                itemIds.push(createdItem.id);
            }

            const createdDetail = await dbAdapter.localSaleDetailAdapter.create({
                style: detail.style,
                merchat: detail.merchat,
                grandTotal: detail.grandTotal,
                poundsGrandTotal: detail.poundsGrandTotal,
                items: itemIds
            }, { session: transaction.session });

            detailIds.push(createdDetail.id);
        }

        const localSale = await dbAdapter.localSaleAdapter.create({
            sale: sale.id,
            wholeTotalPounds,
            tailTotalPounds,
            wholeRejectedPounds,
            trashPounds,
            totalProcessedPounds,
            grandTotal,
            seller,
            details: detailIds
        }, { session: transaction.session });

        await transaction.commit();
        return localSale;
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

const getBySaleId = async (saleId) => {
    const localSaleList = await dbAdapter.localSaleAdapter.getAllWithRelations(
        { sale: saleId, deletedAt: null },
        [
            {
                path: 'details',
                populate: {
                    path: 'items'
                }
            }
        ]
    );

    const localSale = localSaleList[0];
    if (!localSale) throw new Error('Local sale not found');

    // Fetch Sale with populated purchase and its relations
    const sale = await dbAdapter.saleAdapter.getByIdWithRelations(saleId, [
        {
            path: 'purchase',
            populate: ['buyer', 'broker', 'client', 'company', 'shrimpFarm', 'period']
        }
    ]);

    const purchase = sale?.purchase;
    if (!purchase) throw new Error('Associated purchase not found');

    // Fetch person details
    const personIds = [purchase.buyer?.person, purchase.broker?.person, purchase.client?.person].filter(Boolean);
    const persons = await dbAdapter.personAdapter.getAll({ _id: { $in: personIds } });
    const personMap = persons.reduce((map, p) => {
        map[p.id] = `${p.names} ${p.lastNames}`.trim();
        return map;
    }, {});

    return {
        id: localSale.id,
        sale: localSale.sale,
        saleDate: sale.saleDate,
        wholeTotalPounds: localSale.wholeTotalPounds,
        tailTotalPounds: localSale.tailTotalPounds,
        wholeRejectedPounds: localSale.wholeRejectedPounds,
        trashPounds: localSale.trashPounds,
        totalProcessedPounds: localSale.totalProcessedPounds,
        seller: localSale.seller,
        deletedAt: localSale.deletedAt,
        details: localSale.details.map(detail => ({
            id: detail.id,
            style: detail.style,
            merchat: detail.merchat,
            grandTotal: detail.grandTotal,
            poundsGrandTotal: detail.poundsGrandTotal,
            deletedAt: detail.deletedAt,
            items: detail.items.map(item => ({
                id: item.id,
                size: item.size,
                pounds: item.pounds,
                price: item.price,
                total: item.total,
                deletedAt: item.deletedAt
            }))
        })),
        purchase: {
            id: purchase.id,
            controlNumber: purchase.controlNumber,
            purchaseDate: purchase.purchaseDate,
            totalPounds: purchase.totalPounds,
            buyer: purchase.buyer ? {
                id: purchase.buyer._id,
                fullName: personMap[purchase.buyer.person] || 'Unknown'
            } : null,
            broker: purchase.broker ? {
                id: purchase.broker._id,
                fullName: personMap[purchase.broker.person] || 'Unknown'
            } : null,
            client: purchase.client ? {
                id: purchase.client._id,
                fullName: personMap[purchase.client.person] || 'Unknown'
            } : null,
            company: purchase.company ? {
                id: purchase.company._id,
                name: purchase.company.name
            } : null,
            shrimpFarm: purchase.shrimpFarm ? {
                id: purchase.shrimpFarm._id,
                identifier: purchase.shrimpFarm.identifier,
                place: purchase.shrimpFarm.place
            } : null,
            period: purchase.period ? {
                id: purchase.period._id,
                name: purchase.period.name
            } : null
        }
    };
};

const update = async (id, data) => {
    const transaction = await dbAdapter.localSaleAdapter.startTransaction();

    try {
        const existingLocalSale = await dbAdapter.localSaleAdapter.getById(id);
        if (!existingLocalSale) throw new Error('Local Sale not found');

        const sale = await dbAdapter.saleAdapter.getById(existingLocalSale.sale);
        if (!sale) throw new Error('Associated Sale not found');

        const { saleDate, wholeTotalPounds, tailTotalPounds, wholeRejectedPounds, trashPounds, totalProcessedPounds, grandTotal, seller, details } = data;

        // Update sale date if changed
        await dbAdapter.saleAdapter.update(sale.id, { saleDate }, { session: transaction.session });

        // Delete existing details and their items permanently
        const existingDetails = await dbAdapter.localSaleDetailAdapter.getAll({ _id: { $in: existingLocalSale.details } });
        for (const detail of existingDetails) {
            await Promise.all(detail.items.map(itemId => dbAdapter.localSaleDetailItemAdapter.removePermanently(itemId)));
            await dbAdapter.localSaleDetailAdapter.removePermanently(detail.id);
        }

        // Create new detail items and details
        const newDetailIds = [];
        for (const detail of details) {
            const itemIds = [];
            for (const item of detail.items) {
                const newItem = await dbAdapter.localSaleDetailItemAdapter.create(item, { session: transaction.session });
                itemIds.push(newItem.id);
            }

            const newDetail = await dbAdapter.localSaleDetailAdapter.create({
                style: detail.style,
                merchat: detail.merchat,
                grandTotal: detail.grandTotal,
                poundsGrandTotal: detail.poundsGrandTotal,
                items: itemIds
            }, { session: transaction.session });

            newDetailIds.push(newDetail.id);
        }

        // Update local sale
        const updatedLocalSale = await dbAdapter.localSaleAdapter.update(id, {
            wholeTotalPounds,
            tailTotalPounds,
            wholeRejectedPounds,
            trashPounds,
            totalProcessedPounds,
            grandTotal,
            seller,
            details: newDetailIds
        }, { session: transaction.session });

        await transaction.commit();
        return updatedLocalSale;
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};


module.exports = { create, getBySaleId, update };
