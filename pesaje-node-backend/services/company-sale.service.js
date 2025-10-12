const dbAdapter = require('../adapters');

const SaleTypeEnum = require('../enums/sale-type.enum');
const CompanySaleStatusEnum = require('../enums/company-sale-status.enum');


const create = async (data) => {
    const transaction = await dbAdapter.saleAdapter.startTransaction();

    try {
        const { purchase, wholeDetail, tailDetail, ...companySaleData } = data;

        // Validate referenced purchase exists
        const purchaseExists = await dbAdapter.purchaseAdapter.getById(purchase);
        if (!purchaseExists) {
            throw new Error('Purchase does not exist');
        }

        // Create Sale document
        const sale = await dbAdapter.saleAdapter.create({
            purchase,
            weightSheetNumber: companySaleData.weightSheetNumber,
            type: SaleTypeEnum.COMPANY
        }, { session: transaction.session });

        let wholeDetailId = null;
        let tailDetailId = null;

        // Create WholeDetail if provided
        if (wholeDetail && wholeDetail.items && wholeDetail.items.length > 0) {
            const wholeItemIds = [];
            for (const item of wholeDetail.items) {
                const createdItem = await dbAdapter.companySaleItemAdapter.create(item, { session: transaction.session });
                wholeItemIds.push(createdItem.id);
            }

            const createdWholeDetail = await dbAdapter.companySaleWholeDetailAdapter.create({
                ...wholeDetail,
                items: wholeItemIds
            }, { session: transaction.session });
            wholeDetailId = createdWholeDetail.id;
        }

        // Create TailDetail if provided
        if (tailDetail && tailDetail.items && tailDetail.items.length > 0) {
            const tailItemIds = [];
            for (const item of tailDetail.items) {
                const createdItem = await dbAdapter.companySaleItemAdapter.create(item, { session: transaction.session });
                tailItemIds.push(createdItem.id);
            }

            const createdTailDetail = await dbAdapter.companySaleTailDetailAdapter.create({
                ...tailDetail,
                items: tailItemIds
            }, { session: transaction.session });
            tailDetailId = createdTailDetail.id;
        }

        // Set initial status
        companySaleData.status = CompanySaleStatusEnum.DRAFT;

        // Create CompanySale
        const companySale = await dbAdapter.companySaleAdapter.create({
            ...companySaleData,
            sale: sale.id,
            wholeDetail: wholeDetailId,
            tailDetail: tailDetailId
        }, { session: transaction.session });

        await transaction.commit();
        return companySale;
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

const getById = async (id) => {
    const companySale = await dbAdapter.companySaleAdapter.getByIdWithRelations(id, [
        {
            path: 'wholeDetail',
            populate: 'items'
        },
        {
            path: 'tailDetail',
            populate: 'items'
        },
        {
            path: 'sale'
        }
    ]);

    if (!companySale) throw new Error('Company sale not found');

    const result = {
        ...companySale,
        weightSheetNumber: companySale.sale?.weightSheetNumber
    };

    // Map wholeDetail items
    if (companySale.wholeDetail) {
        result.wholeDetail = {
            ...companySale.wholeDetail,
            items: companySale.wholeDetail.items?.map(item => ({
                id: item.id,
                style: item.style,
                class: item.class,
                size: item.size,
                pounds: item.pounds,
                price: item.price,
                referencePrice: item.referencePrice,
                total: item.total,
                percentage: item.percentage,
                deletedAt: item.deletedAt
            })) || []
        };
    }

    // Map tailDetail items
    if (companySale.tailDetail) {
        result.tailDetail = {
            ...companySale.tailDetail,
            items: companySale.tailDetail.items?.map(item => ({
                id: item.id,
                style: item.style,
                class: item.class,
                size: item.size,
                pounds: item.pounds,
                price: item.price,
                referencePrice: item.referencePrice,
                total: item.total,
                percentage: item.percentage,
                deletedAt: item.deletedAt
            })) || []
        };
    }

    return result;
};

const getBySaleId = async (saleId) => {
    const companySaleList = await dbAdapter.companySaleAdapter.getAllWithRelations(
        { sale: saleId, deletedAt: null },
        [
            {
                path: 'wholeDetail',
                populate: 'items'
            },
            {
                path: 'tailDetail',
                populate: 'items'
            }
        ]
    );

    const companySale = companySaleList[0];
    if (!companySale) throw new Error('Company sale not found');

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

    const result = {
        id: companySale.id,
        sale: companySale.sale,
        weightSheetNumber: sale.weightSheetNumber,
        status: companySale.status,
        batch: companySale.batch,
        provider: companySale.provider,
        receptionDate: companySale.receptionDate,
        settleDate: companySale.settleDate,
        predominantSize: companySale.predominantSize,
        wholeReceivedPounds: companySale.wholeReceivedPounds,
        trashPounds: companySale.trashPounds,
        netReceivedPounds: companySale.netReceivedPounds,
        processedPounds: companySale.processedPounds,
        performance: companySale.performance,
        poundsGrandTotal: companySale.poundsGrandTotal,
        grandTotal: companySale.grandTotal,
        percentageTotal: companySale.percentageTotal,
        deletedAt: companySale.deletedAt,
    };

    // Map wholeDetail items
    if (companySale.wholeDetail) {
        result.wholeDetail = {
            ...companySale.wholeDetail,
            items: companySale.wholeDetail.items?.map(item => ({
                id: item.id,
                style: item.style,
                class: item.class,
                size: item.size,
                pounds: item.pounds,
                price: item.price,
                referencePrice: item.referencePrice,
                total: item.total,
                percentage: item.percentage,
                deletedAt: item.deletedAt
            })) || []
        };
    }

    // Map tailDetail items
    if (companySale.tailDetail) {
        result.tailDetail = {
            ...companySale.tailDetail,
            items: companySale.tailDetail.items?.map(item => ({
                id: item.id,
                style: item.style,
                class: item.class,
                size: item.size,
                pounds: item.pounds,
                price: item.price,
                referencePrice: item.referencePrice,
                total: item.total,
                percentage: item.percentage,
                deletedAt: item.deletedAt
            })) || []
        };
    }

    result.purchase = {
        id: purchase.id,
        controlNumber: purchase.controlNumber,
        purchaseDate: purchase.purchaseDate,
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
    };

    return result;
};

const update = async (id, data) => {
    const transaction = await dbAdapter.companySaleAdapter.startTransaction();

    try {
        const existingCompanySale = await dbAdapter.companySaleAdapter.getByIdWithRelations(id, [
            'wholeDetail',
            'tailDetail'
        ]);
        if (!existingCompanySale) {
            throw new Error('Company sale not found');
        }

        const saleId = existingCompanySale.sale;

        // 🔸 Update the Sale's weightSheetNumber
        await dbAdapter.saleAdapter.update(saleId, {
            weightSheetNumber: data.weightSheetNumber
        }, { session: transaction.session });

        const { wholeDetail, tailDetail, ...companySaleData } = data;
        let wholeDetailId = existingCompanySale.wholeDetail?._id || null;
        let tailDetailId = existingCompanySale.tailDetail?._id || null;

        // Handle WholeDetail update/create/delete
        if (wholeDetail && wholeDetail.items && wholeDetail.items.length > 0) {
            if (wholeDetailId) {
                // Update existing whole detail - remove old items and create new ones
                const existingWholeDetail = await dbAdapter.companySaleWholeDetailAdapter.getById(wholeDetailId);
                for (const itemId of existingWholeDetail.items) {
                    await dbAdapter.companySaleItemAdapter.removePermanently(itemId);
                }

                const wholeItemIds = [];
                for (const item of wholeDetail.items) {
                    const createdItem = await dbAdapter.companySaleItemAdapter.create(item, { session: transaction.session });
                    wholeItemIds.push(createdItem.id);
                }

                await dbAdapter.companySaleWholeDetailAdapter.update(wholeDetailId, {
                    ...wholeDetail,
                    items: wholeItemIds
                }, { session: transaction.session });
            } else {
                // Create new whole detail
                const wholeItemIds = [];
                for (const item of wholeDetail.items) {
                    const createdItem = await dbAdapter.companySaleItemAdapter.create(item, { session: transaction.session });
                    wholeItemIds.push(createdItem.id);
                }

                const createdWholeDetail = await dbAdapter.companySaleWholeDetailAdapter.create({
                    ...wholeDetail,
                    items: wholeItemIds
                }, { session: transaction.session });
                wholeDetailId = createdWholeDetail.id;
            }
        } else if (wholeDetailId) {
            // Delete existing whole detail if no items provided
            const existingWholeDetail = await dbAdapter.companySaleWholeDetailAdapter.getById(wholeDetailId);
            for (const itemId of existingWholeDetail.items) {
                await dbAdapter.companySaleItemAdapter.removePermanently(itemId);
            }
            await dbAdapter.companySaleWholeDetailAdapter.removePermanently(wholeDetailId);
            wholeDetailId = null;
        }

        // Handle TailDetail update/create/delete
        if (tailDetail && tailDetail.items && tailDetail.items.length > 0) {
            if (tailDetailId) {
                // Update existing tail detail - remove old items and create new ones
                const existingTailDetail = await dbAdapter.companySaleTailDetailAdapter.getById(tailDetailId);
                for (const itemId of existingTailDetail.items) {
                    await dbAdapter.companySaleItemAdapter.removePermanently(itemId);
                }

                const tailItemIds = [];
                for (const item of tailDetail.items) {
                    const createdItem = await dbAdapter.companySaleItemAdapter.create(item, { session: transaction.session });
                    tailItemIds.push(createdItem.id);
                }

                await dbAdapter.companySaleTailDetailAdapter.update(tailDetailId, {
                    ...tailDetail,
                    items: tailItemIds
                }, { session: transaction.session });
            } else {
                // Create new tail detail
                const tailItemIds = [];
                for (const item of tailDetail.items) {
                    const createdItem = await dbAdapter.companySaleItemAdapter.create(item, { session: transaction.session });
                    tailItemIds.push(createdItem.id);
                }

                const createdTailDetail = await dbAdapter.companySaleTailDetailAdapter.create({
                    ...tailDetail,
                    items: tailItemIds
                }, { session: transaction.session });
                tailDetailId = createdTailDetail.id;
            }
        } else if (tailDetailId) {
            // Delete existing tail detail if no items provided
            const existingTailDetail = await dbAdapter.companySaleTailDetailAdapter.getById(tailDetailId);
            for (const itemId of existingTailDetail.items) {
                await dbAdapter.companySaleItemAdapter.removePermanently(itemId);
            }
            await dbAdapter.companySaleTailDetailAdapter.removePermanently(tailDetailId);
            tailDetailId = null;
        }

        // ✏️ Update the CompanySale record
        const updatedCompanySale = await dbAdapter.companySaleAdapter.update(id, {
            batch: companySaleData.batch,
            provider: companySaleData.provider,
            receptionDate: companySaleData.receptionDate,
            settleDate: companySaleData.settleDate,
            predominantSize: companySaleData.predominantSize,
            wholeReceivedPounds: companySaleData.wholeReceivedPounds,
            trashPounds: companySaleData.trashPounds,
            netReceivedPounds: companySaleData.netReceivedPounds,
            processedPounds: companySaleData.processedPounds,
            performance: companySaleData.performance,
            poundsGrandTotal: companySaleData.poundsGrandTotal,
            grandTotal: companySaleData.grandTotal,
            percentageTotal: companySaleData.percentageTotal,
            wholeDetail: wholeDetailId,
            tailDetail: tailDetailId
        }, { session: transaction.session });

        await transaction.commit();
        return updatedCompanySale;
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

module.exports = {
    create,
    getById,
    getBySaleId,
    update,
};
