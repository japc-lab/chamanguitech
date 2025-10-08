const dbAdapter = require('../adapters');
const SaleTypeEnum = require('../enums/sale-type.enum');

const create = async (data) => {
    let transaction;
    
    try {
        transaction = await dbAdapter.localSaleAdapter.startTransaction();
        const {
            purchase,
            saleDate,
            wholeTotalPounds,
            moneyIncomeForRejectedHeads,
            wholeRejectedPounds,
            trashPounds,
            totalProcessedPounds,
            grandTotal,
            seller,
            weightSheetNumber,
            hasInvoice,
            invoiceNumber,
            invoiceName,
            details,
            localCompanyDetails
        } = data;

        // 🔍 Validate referenced Purchase
        const purchaseExists = await dbAdapter.purchaseAdapter.getById(purchase);
        if (!purchaseExists) throw new Error('Purchase does not exist');

        // 🔍 Validate local company details if provided
        if (localCompanyDetails && localCompanyDetails.length > 0) {
            for (const companyDetail of localCompanyDetails) {
                if (companyDetail.company) {
                    const companyExists = await dbAdapter.companyAdapter.getById(companyDetail.company);
                    if (!companyExists) throw new Error(`Company with ID ${companyDetail.company} does not exist`);
                }
                
                // Validate required fields
                if (!companyDetail.items || companyDetail.items.length === 0) {
                    throw new Error('Local company details must have at least one item');
                }
                
                // Validate each item
                for (const item of companyDetail.items) {
                    if (!item.size || !item.class || item.pounds === undefined || item.price === undefined) {
                        throw new Error('All item fields (size, class, pounds, price) are required');
                    }
                }
            }
        }

        // 📦 Create Sale document
        const sale = await dbAdapter.saleAdapter.create({
            purchase,
            saleDate,
            weightSheetNumber,
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

        // Handle local company details
        const localCompanyDetailIds = [];
        
        if (localCompanyDetails && localCompanyDetails.length > 0) {
            for (const companyDetail of localCompanyDetails) {
                const companyItemIds = [];

                for (const item of companyDetail.items) {
                    const createdItem = await dbAdapter.localCompanySaleDetailItemAdapter.create(item, { session: transaction.session });
                    companyItemIds.push(createdItem.id);
                }

                const createdCompanyDetail = await dbAdapter.localCompanySaleDetailAdapter.create({
                    company: companyDetail.company,
                    receiptDate: companyDetail.receiptDate,
                    personInCharge: companyDetail.personInCharge,
                    batch: companyDetail.batch,
                    guideWeight: companyDetail.guideWeight,
                    guideNumber: companyDetail.guideNumber,
                    weightDifference: companyDetail.weightDifference,
                    processedWeight: companyDetail.processedWeight,
                    items: companyItemIds
                }, { session: transaction.session });

                localCompanyDetailIds.push(createdCompanyDetail.id);
            }
        }

        const localSale = await dbAdapter.localSaleAdapter.create({
            sale: sale.id,
            wholeTotalPounds,
            moneyIncomeForRejectedHeads,
            wholeRejectedPounds,
            trashPounds,
            totalProcessedPounds,
            grandTotal,
            seller,
            hasInvoice,
            invoiceNumber,
            invoiceName,
            details: detailIds,
            localCompanyDetails: localCompanyDetailIds
        }, { session: transaction.session });

        await transaction.commit();
        return localSale;
    } catch (error) {
        console.error('Error in create local sale:', error);
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Error during rollback:', rollbackError);
            }
        }
        throw new Error(`Failed to create local sale: ${error.message}`);
    } finally {
        if (transaction) {
            try {
                await transaction.end();
            } catch (endError) {
                console.error('Error ending transaction:', endError);
            }
        }
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
            },
            {
                path: 'localCompanyDetails',
                populate: [
                    {
                        path: 'items'
                    },
                    {
                        path: 'company'
                    }
                ]
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
        weightSheetNumber: sale.weightSheetNumber,
        wholeTotalPounds: localSale.wholeTotalPounds,
        moneyIncomeForRejectedHeads: localSale.moneyIncomeForRejectedHeads,
        wholeRejectedPounds: localSale.wholeRejectedPounds,
        trashPounds: localSale.trashPounds,
        totalProcessedPounds: localSale.totalProcessedPounds,
        seller: localSale.seller,
        hasInvoice: localSale.hasInvoice,
        invoiceNumber: localSale.invoiceNumber,
        invoiceName: localSale.invoiceName,
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
        localCompanyDetails: localSale.localCompanyDetails ? localSale.localCompanyDetails.map(companyDetail => ({
            id: companyDetail.id,
            company: companyDetail.company ? {
                id: companyDetail.company._id || companyDetail.company.id,
                name: companyDetail.company.name
            } : companyDetail.company,
            receiptDate: companyDetail.receiptDate,
            personInCharge: companyDetail.personInCharge,
            batch: companyDetail.batch,
            guideWeight: companyDetail.guideWeight,
            guideNumber: companyDetail.guideNumber,
            weightDifference: companyDetail.weightDifference,
            processedWeight: companyDetail.processedWeight,
            deletedAt: companyDetail.deletedAt,
            items: companyDetail.items.map(item => ({
                id: item.id,
                size: item.size,
                class: item.class,
                pounds: item.pounds,
                price: item.price,
                total: item.total,
                deletedAt: item.deletedAt
            }))
        })) : [],
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
    let transaction;
    
    try {
        transaction = await dbAdapter.localSaleAdapter.startTransaction();
        const existingLocalSale = await dbAdapter.localSaleAdapter.getById(id);
        if (!existingLocalSale) throw new Error('Local Sale not found');

        const sale = await dbAdapter.saleAdapter.getById(existingLocalSale.sale);
        if (!sale) throw new Error('Associated Sale not found');

        const { saleDate, wholeTotalPounds, moneyIncomeForRejectedHeads, wholeRejectedPounds, trashPounds, totalProcessedPounds, grandTotal, seller, weightSheetNumber, hasInvoice, invoiceNumber, invoiceName, details, localCompanyDetails } = data;

        // 🔍 Validate local company details if provided
        if (localCompanyDetails && localCompanyDetails.length > 0) {
            for (const companyDetail of localCompanyDetails) {
                if (companyDetail.company) {
                    const companyExists = await dbAdapter.companyAdapter.getById(companyDetail.company);
                    if (!companyExists) throw new Error(`Company with ID ${companyDetail.company} does not exist`);
                }
                
                // Validate required fields
                if (!companyDetail.items || companyDetail.items.length === 0) {
                    throw new Error('Local company details must have at least one item');
                }
                
                // Validate each item
                for (const item of companyDetail.items) {
                    if (!item.size || !item.class || item.pounds === undefined || item.price === undefined) {
                        throw new Error('All item fields (size, class, pounds, price) are required');
                    }
                }
            }
        }

        // Update sale date if changed
        await dbAdapter.saleAdapter.update(sale.id, { saleDate, weightSheetNumber }, { session: transaction.session });

        // Delete existing details and their items permanently
        if (existingLocalSale.details && existingLocalSale.details.length > 0) {
            const existingDetails = await dbAdapter.localSaleDetailAdapter.getAll({ _id: { $in: existingLocalSale.details } });
            for (const detail of existingDetails) {
                // Delete items first
                if (detail.items && detail.items.length > 0) {
                    for (const itemId of detail.items) {
                        await dbAdapter.localSaleDetailItemAdapter.removePermanently(itemId, { session: transaction.session });
                    }
                }
                // Then delete the detail
                await dbAdapter.localSaleDetailAdapter.removePermanently(detail.id, { session: transaction.session });
            }
        }

        // Delete existing local company details and their items permanently
        if (existingLocalSale.localCompanyDetails && existingLocalSale.localCompanyDetails.length > 0) {
            const existingCompanyDetails = await dbAdapter.localCompanySaleDetailAdapter.getAll({ _id: { $in: existingLocalSale.localCompanyDetails } });
            for (const companyDetail of existingCompanyDetails) {
                // Delete items first
                if (companyDetail.items && companyDetail.items.length > 0) {
                    for (const itemId of companyDetail.items) {
                        await dbAdapter.localCompanySaleDetailItemAdapter.removePermanently(itemId, { session: transaction.session });
                    }
                }
                // Then delete the company detail
                await dbAdapter.localCompanySaleDetailAdapter.removePermanently(companyDetail.id, { session: transaction.session });
            }
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

        // Create new local company details
        const newLocalCompanyDetailIds = [];
        
        if (localCompanyDetails && localCompanyDetails.length > 0) {
            for (const companyDetail of localCompanyDetails) {
                const companyItemIds = [];

                for (const item of companyDetail.items) {
                    const newItem = await dbAdapter.localCompanySaleDetailItemAdapter.create(item, { session: transaction.session });
                    companyItemIds.push(newItem.id);
                }

                const newCompanyDetail = await dbAdapter.localCompanySaleDetailAdapter.create({
                    company: companyDetail.company,
                    receiptDate: companyDetail.receiptDate,
                    personInCharge: companyDetail.personInCharge,
                    batch: companyDetail.batch,
                    guideWeight: companyDetail.guideWeight,
                    guideNumber: companyDetail.guideNumber,
                    weightDifference: companyDetail.weightDifference,
                    processedWeight: companyDetail.processedWeight,
                    items: companyItemIds
                }, { session: transaction.session });

                newLocalCompanyDetailIds.push(newCompanyDetail.id);
            }
        }

        // Update local sale
        const updatedLocalSale = await dbAdapter.localSaleAdapter.update(id, {
            wholeTotalPounds,
            moneyIncomeForRejectedHeads,
            wholeRejectedPounds,
            trashPounds,
            totalProcessedPounds,
            grandTotal,
            seller,
            weightSheetNumber,
            hasInvoice,
            invoiceNumber,
            invoiceName,
            details: newDetailIds,
            localCompanyDetails: newLocalCompanyDetailIds
        }, { session: transaction.session });

        await transaction.commit();
        return updatedLocalSale;
    } catch (error) {
        console.error('Error in update local sale:', error);
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Error during rollback:', rollbackError);
            }
        }
        throw new Error(`Failed to update local sale: ${error.message}`);
    } finally {
        if (transaction) {
            try {
                await transaction.end();
            } catch (endError) {
                console.error('Error ending transaction:', endError);
            }
        }
    }
};


module.exports = { create, getBySaleId, update };
