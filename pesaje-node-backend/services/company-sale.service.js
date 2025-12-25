const dbAdapter = require('../adapters');

const SaleTypeEnum = require('../enums/sale-type.enum');
const CompanySaleStatusEnum = require('../enums/company-sale-status.enum');


const create = async (data) => {
    const transaction = await dbAdapter.saleAdapter.startTransaction();

    try {
        const { purchase, wholeDetail, tailDetail, ...companySaleData } = data;

        // Determine status - use provided status or default to DRAFT
        const status = data.status || CompanySaleStatusEnum.DRAFT;

        // Validate referenced purchase exists if provided, and create Sale record
        let sale = null;
        if (purchase) {
            const purchaseExists = await dbAdapter.purchaseAdapter.getById(purchase);
            if (!purchaseExists) {
                throw new Error('Purchase does not exist');
            }

            // Use company sale weightSheetNumber if provided, otherwise use purchase's weightSheetNumber
            // Fallback to 'DRAFT' if neither is available to satisfy Sale model requirement
            const weightSheetNumber = companySaleData.weightSheetNumber || purchaseExists.weightSheetNumber || 'DRAFT';

            // Create Sale document (even for DRAFT status to maintain referential integrity)
            sale = await dbAdapter.saleAdapter.create({
                purchase,
                weightSheetNumber: weightSheetNumber,
                type: SaleTypeEnum.COMPANY
            }, { session: transaction.session });
        }

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

        // Create CompanySale
        const companySale = await dbAdapter.companySaleAdapter.create({
            ...companySaleData,
            status,
            sale: sale?.id || null,
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
                unit: item.unit,
                amount: item.amount,
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
                unit: item.unit,
                amount: item.amount,
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
        summaryPoundsReceived: companySale.summaryPoundsReceived,
        summaryPerformancePercentage: companySale.summaryPerformancePercentage,
        summaryRetentionPercentage: companySale.summaryRetentionPercentage,
        summaryAdditionalPenalty: companySale.summaryAdditionalPenalty,
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
                unit: item.unit,
                amount: item.amount,
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
                unit: item.unit,
                amount: item.amount,
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
        } : null,
        totalPounds: purchase.totalPounds,
        grandTotal: purchase.grandTotal
    };

    return result;
};

const update = async (id, data) => {
    // Check if this is a status-only update
    if (Object.keys(data).length === 1 && data.status) {
        return await updateStatus(id, data.status);
    }

    const transaction = await dbAdapter.companySaleAdapter.startTransaction();

    try {
        const existingCompanySale = await dbAdapter.companySaleAdapter.getByIdWithRelations(id, [
            'wholeDetail',
            'tailDetail'
        ]);
        if (!existingCompanySale) {
            throw new Error('Company sale not found');
        }

        const { purchase, wholeDetail, tailDetail, ...companySaleData } = data;
        const status = data.status || existingCompanySale.status;
        const saleId = existingCompanySale.sale;

        // Handle Sale creation/update based on status
        let finalSaleId = saleId;
        
        // Create Sale document if purchase is provided and sale doesn't exist yet
        if (purchase && !saleId) {
            // Validate purchase exists
            const purchaseExists = await dbAdapter.purchaseAdapter.getById(purchase);
            if (!purchaseExists) {
                throw new Error('Purchase does not exist');
            }

            // Use company sale weightSheetNumber if provided, otherwise use purchase's weightSheetNumber
            // Fallback to 'DRAFT' if neither is available to satisfy Sale model requirement
            const weightSheetNumber = data.weightSheetNumber || purchaseExists.weightSheetNumber || 'DRAFT';

            // Create Sale document (even for DRAFT status to maintain referential integrity)
            const newSale = await dbAdapter.saleAdapter.create({
                purchase,
                weightSheetNumber: weightSheetNumber,
                type: SaleTypeEnum.COMPANY
            }, { session: transaction.session });
            finalSaleId = newSale.id;
        } else if (status !== CompanySaleStatusEnum.DRAFT && !saleId && !purchase) {
            // Cannot transition to non-DRAFT without a purchase or existing sale
            throw new Error('Purchase is required when updating status from DRAFT to non-DRAFT');
        } else if (saleId && data.weightSheetNumber) {
            // Update existing Sale's weightSheetNumber if provided
            await dbAdapter.saleAdapter.update(saleId, {
                weightSheetNumber: data.weightSheetNumber
            }, { session: transaction.session });
        }

        let wholeDetailId = existingCompanySale.wholeDetail?._id || null;
        let tailDetailId = existingCompanySale.tailDetail?._id || null;

        // Handle WholeDetail update/create/delete
        if (wholeDetail && wholeDetail.items && wholeDetail.items.length > 0) {
            if (wholeDetailId) {
                // Update existing whole detail - remove old items and create new ones
                const existingWholeDetail = await dbAdapter.companySaleWholeDetailAdapter.getById(wholeDetailId);
                if (existingWholeDetail && existingWholeDetail.items) {
                    for (const itemId of existingWholeDetail.items) {
                        await dbAdapter.companySaleItemAdapter.removePermanently(itemId, { session: transaction.session });
                    }
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
            if (existingWholeDetail && existingWholeDetail.items) {
                for (const itemId of existingWholeDetail.items) {
                    await dbAdapter.companySaleItemAdapter.removePermanently(itemId, { session: transaction.session });
                }
            }
            await dbAdapter.companySaleWholeDetailAdapter.removePermanently(wholeDetailId, { session: transaction.session });
            wholeDetailId = null;
        }

        // Handle TailDetail update/create/delete
        if (tailDetail && tailDetail.items && tailDetail.items.length > 0) {
            if (tailDetailId) {
                // Update existing tail detail - remove old items and create new ones
                const existingTailDetail = await dbAdapter.companySaleTailDetailAdapter.getById(tailDetailId);
                if (existingTailDetail && existingTailDetail.items) {
                    for (const itemId of existingTailDetail.items) {
                        await dbAdapter.companySaleItemAdapter.removePermanently(itemId, { session: transaction.session });
                    }
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
            if (existingTailDetail && existingTailDetail.items) {
                for (const itemId of existingTailDetail.items) {
                    await dbAdapter.companySaleItemAdapter.removePermanently(itemId, { session: transaction.session });
                }
            }
            await dbAdapter.companySaleTailDetailAdapter.removePermanently(tailDetailId, { session: transaction.session });
            tailDetailId = null;
        }

        // ✏️ Update the CompanySale record
        const updateData = {
            batch: companySaleData.batch,
            provider: companySaleData.provider,
            predominantSize: companySaleData.predominantSize,
            wholeReceivedPounds: companySaleData.wholeReceivedPounds,
            trashPounds: companySaleData.trashPounds,
            netReceivedPounds: companySaleData.netReceivedPounds,
            processedPounds: companySaleData.processedPounds,
            performance: companySaleData.performance,
            poundsGrandTotal: companySaleData.poundsGrandTotal,
            grandTotal: companySaleData.grandTotal,
            percentageTotal: companySaleData.percentageTotal,
            summaryPoundsReceived: companySaleData.summaryPoundsReceived,
            summaryPerformancePercentage: companySaleData.summaryPerformancePercentage,
            summaryRetentionPercentage: companySaleData.summaryRetentionPercentage,
            summaryAdditionalPenalty: companySaleData.summaryAdditionalPenalty,
            status,
            sale: finalSaleId,
            wholeDetail: wholeDetailId,
            tailDetail: tailDetailId
        };

        // Handle date fields - only include if not empty for DRAFT status
        if (companySaleData.receptionDate && companySaleData.receptionDate !== '') {
            updateData.receptionDate = companySaleData.receptionDate;
        } else if (status !== CompanySaleStatusEnum.DRAFT && companySaleData.receptionDate !== undefined) {
            // For non-DRAFT status, include even if empty to allow clearing
            updateData.receptionDate = companySaleData.receptionDate;
        }

        if (companySaleData.settleDate && companySaleData.settleDate !== '') {
            updateData.settleDate = companySaleData.settleDate;
        } else if (status !== CompanySaleStatusEnum.DRAFT && companySaleData.settleDate !== undefined) {
            // For non-DRAFT status, include even if empty to allow clearing
            updateData.settleDate = companySaleData.settleDate;
        }

        // Remove undefined and null values (but keep empty strings for non-DRAFT if explicitly provided)
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || updateData[key] === null) {
                delete updateData[key];
            }
        });

        const updatedCompanySale = await dbAdapter.companySaleAdapter.update(id, updateData, { session: transaction.session });

        await transaction.commit();
        return updatedCompanySale;
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

const updateStatus = async (id, status) => {
    const existingCompanySale = await dbAdapter.companySaleAdapter.getById(id);
    if (!existingCompanySale) {
        throw new Error('Company sale not found');
    }

    // Update only the status field
    const updatedCompanySale = await dbAdapter.companySaleAdapter.update(id, { status });
    return updatedCompanySale;
};

module.exports = {
    create,
    getById,
    getBySaleId,
    update,
    updateStatus,
};
