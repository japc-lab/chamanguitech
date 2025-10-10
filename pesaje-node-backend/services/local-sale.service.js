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
            localSaleDetails,
            localCompanySaleDetail
        } = data;

        // 🔍 Validate referenced Purchase
        const purchaseExists = await dbAdapter.purchaseAdapter.getById(purchase);
        if (!purchaseExists) throw new Error('Purchase does not exist');

        // 🔍 Validate local sale details if provided
        if (localSaleDetails && localSaleDetails.length > 0) {
            for (const localSaleDetail of localSaleDetails) {
                if (!localSaleDetail.items || localSaleDetail.items.length === 0) {
                    throw new Error('Local sale detail must have at least one item');
                }

                // Validate each item and payment methods
                for (const item of localSaleDetail.items) {
                    if (!item.size || item.pounds === undefined || item.price === undefined) {
                        throw new Error('All item fields (size, pounds, price) are required');
                    }

                    // Validate payment method if paymentStatus is PAID
                    if (item.paymentStatus === 'PAID' && item.paymentMethod) {
                        const paymentMethodExists = await dbAdapter.paymentMethodAdapter.getById(item.paymentMethod);
                        if (!paymentMethodExists) {
                            throw new Error(`Payment method with ID ${item.paymentMethod} does not exist`);
                        }
                    }
                }
            }
        }

        // 🔍 Validate local company detail if provided
        if (localCompanySaleDetail) {
            if (localCompanySaleDetail.company) {
                const companyExists = await dbAdapter.companyAdapter.getById(localCompanySaleDetail.company);
                if (!companyExists) throw new Error(`Company with ID ${localCompanySaleDetail.company} does not exist`);
            }

            // Validate required fields
            if (!localCompanySaleDetail.items || localCompanySaleDetail.items.length === 0) {
                throw new Error('Local company detail must have at least one item');
            }

            // Validate each item
            for (const item of localCompanySaleDetail.items) {
                if (!item.size || !item.class || item.pounds === undefined || item.price === undefined) {
                    throw new Error('All item fields (size, class, pounds, price) are required');
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

        // Create local sale first
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
            localCompanySaleDetail: null // Will be set later if exists
        }, { session: transaction.session });

        // Create local sale details (multiple objects) with reference to localSale
        if (localSaleDetails && localSaleDetails.length > 0) {
            for (const localSaleDetail of localSaleDetails) {
                const itemIds = [];

                for (const item of localSaleDetail.items) {
                    const createdItem = await dbAdapter.localSaleDetailItemAdapter.create(item, { session: transaction.session });
                    itemIds.push(createdItem.id);
                }

                await dbAdapter.localSaleDetailAdapter.create({
                    localSale: localSale.id,
                    style: localSaleDetail.style,
                    grandTotal: localSaleDetail.grandTotal,
                    receivedGrandTotal: localSaleDetail.receivedGrandTotal,
                    poundsGrandTotal: localSaleDetail.poundsGrandTotal,
                    retentionPercentage: localSaleDetail.retentionPercentage,
                    retentionAmount: localSaleDetail.retentionAmount,
                    netGrandTotal: localSaleDetail.netGrandTotal,
                    otherPenalties: localSaleDetail.otherPenalties,
                    items: itemIds
                }, { session: transaction.session });
            }
        }

        // Handle local company detail (single object)
        if (localCompanySaleDetail) {
            const companyItemIds = [];

            for (const item of localCompanySaleDetail.items) {
                const createdItem = await dbAdapter.localCompanySaleDetailItemAdapter.create(item, { session: transaction.session });
                companyItemIds.push(createdItem.id);
            }

            const createdCompanyDetail = await dbAdapter.localCompanySaleDetailAdapter.create({
                company: localCompanySaleDetail.company,
                receiptDate: localCompanySaleDetail.receiptDate,
                personInCharge: localCompanySaleDetail.personInCharge,
                batch: localCompanySaleDetail.batch,
                guideWeight: localCompanySaleDetail.guideWeight,
                guideNumber: localCompanySaleDetail.guideNumber,
                weightDifference: localCompanySaleDetail.weightDifference,
                processedWeight: localCompanySaleDetail.processedWeight,
                poundsGrandTotal: localCompanySaleDetail.poundsGrandTotal,
                grandTotal: localCompanySaleDetail.grandTotal,
                retentionPercentage: localCompanySaleDetail.retentionPercentage,
                retentionAmount: localCompanySaleDetail.retentionAmount,
                netGrandTotal: localCompanySaleDetail.netGrandTotal,
                otherPenalties: localCompanySaleDetail.otherPenalties,
                items: companyItemIds
            }, { session: transaction.session });

            // Update localSale with company detail reference
            await dbAdapter.localSaleAdapter.update(localSale.id, {
                localCompanySaleDetail: createdCompanyDetail.id
            }, { session: transaction.session });
        }

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
                path: 'localCompanySaleDetail',
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

    // Get localSaleDetails by localSale reference
    const localSaleDetailList = await dbAdapter.localSaleDetailAdapter.getAllWithRelations(
        { localSale: localSale.id, deletedAt: null },
        [
            {
                path: 'items'
            }
        ]
    );

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
        localSaleDetails: localSaleDetailList.map(localSaleDetail => ({
            id: localSaleDetail.id,
            style: localSaleDetail.style,
            grandTotal: localSaleDetail.grandTotal,
            receivedGrandTotal: localSaleDetail.receivedGrandTotal,
            poundsGrandTotal: localSaleDetail.poundsGrandTotal,
            retentionPercentage: localSaleDetail.retentionPercentage,
            retentionAmount: localSaleDetail.retentionAmount,
            netGrandTotal: localSaleDetail.netGrandTotal,
            otherPenalties: localSaleDetail.otherPenalties,
            deletedAt: localSaleDetail.deletedAt,
            items: localSaleDetail.items.map(item => ({
                id: item.id,
                size: item.size,
                pounds: item.pounds,
                price: item.price,
                total: item.total,
                merchantName: item.merchantName,
                merchantId: item.merchantId,
                paymentOne: item.paymentOne,
                paymentTwo: item.paymentTwo,
                totalPaid: item.totalPaid,
                paymentStatus: item.paymentStatus,
                paymentMethod: item.paymentMethod,
                hasInvoice: item.hasInvoice,
                invoiceNumber: item.invoiceNumber,
                totalReceived: item.totalReceived,
                deletedAt: item.deletedAt
            }))
        })),
        localCompanySaleDetail: localSale.localCompanySaleDetail ? {
            id: localSale.localCompanySaleDetail.id,
            company: localSale.localCompanySaleDetail.company ? {
                id: localSale.localCompanySaleDetail.company._id || localSale.localCompanySaleDetail.company.id,
                name: localSale.localCompanySaleDetail.company.name
            } : localSale.localCompanySaleDetail.company,
            receiptDate: localSale.localCompanySaleDetail.receiptDate,
            personInCharge: localSale.localCompanySaleDetail.personInCharge,
            batch: localSale.localCompanySaleDetail.batch,
            guideWeight: localSale.localCompanySaleDetail.guideWeight,
            guideNumber: localSale.localCompanySaleDetail.guideNumber,
            weightDifference: localSale.localCompanySaleDetail.weightDifference,
            processedWeight: localSale.localCompanySaleDetail.processedWeight,
            poundsGrandTotal: localSale.localCompanySaleDetail.poundsGrandTotal,
            grandTotal: localSale.localCompanySaleDetail.grandTotal,
            retentionPercentage: localSale.localCompanySaleDetail.retentionPercentage,
            retentionAmount: localSale.localCompanySaleDetail.retentionAmount,
            netGrandTotal: localSale.localCompanySaleDetail.netGrandTotal,
            otherPenalties: localSale.localCompanySaleDetail.otherPenalties,
            deletedAt: localSale.localCompanySaleDetail.deletedAt,
            items: localSale.localCompanySaleDetail.items.map(item => ({
                id: item.id,
                size: item.size,
                class: item.class,
                pounds: item.pounds,
                price: item.price,
                total: item.total,
                deletedAt: item.deletedAt
            }))
        } : null,
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

        const { saleDate, wholeTotalPounds, moneyIncomeForRejectedHeads, wholeRejectedPounds, trashPounds, totalProcessedPounds, grandTotal, seller, weightSheetNumber, hasInvoice, invoiceNumber, invoiceName, localSaleDetails, localCompanySaleDetail } = data;

        // 🔍 Validate local sale details if provided
        if (localSaleDetails && localSaleDetails.length > 0) {
            for (const localSaleDetail of localSaleDetails) {
                if (!localSaleDetail.items || localSaleDetail.items.length === 0) {
                    throw new Error('Local sale detail must have at least one item');
                }

                // Validate each item and payment methods
                for (const item of localSaleDetail.items) {
                    if (!item.size || item.pounds === undefined || item.price === undefined) {
                        throw new Error('All item fields (size, pounds, price) are required');
                    }

                    // Validate payment method if paymentStatus is PAID
                    if (item.paymentStatus === 'PAID' && item.paymentMethod) {
                        const paymentMethodExists = await dbAdapter.paymentMethodAdapter.getById(item.paymentMethod);
                        if (!paymentMethodExists) {
                            throw new Error(`Payment method with ID ${item.paymentMethod} does not exist`);
                        }
                    }
                }
            }
        }

        // 🔍 Validate local company detail if provided
        if (localCompanySaleDetail) {
            if (localCompanySaleDetail.company) {
                const companyExists = await dbAdapter.companyAdapter.getById(localCompanySaleDetail.company);
                if (!companyExists) throw new Error(`Company with ID ${localCompanySaleDetail.company} does not exist`);
            }

            // Validate required fields
            if (!localCompanySaleDetail.items || localCompanySaleDetail.items.length === 0) {
                throw new Error('Local company detail must have at least one item');
            }

            // Validate each item
            for (const item of localCompanySaleDetail.items) {
                if (!item.size || !item.class || item.pounds === undefined || item.price === undefined) {
                    throw new Error('All item fields (size, class, pounds, price) are required');
                }
            }
        }

        // Update sale date if changed
        await dbAdapter.saleAdapter.update(sale.id, { saleDate, weightSheetNumber }, { session: transaction.session });

        // Delete existing detail and its items permanently (find by localSale reference)
        const existingDetails = await dbAdapter.localSaleDetailAdapter.getAll({ localSale: existingLocalSale.id });
        for (const existingDetail of existingDetails) {
            // Delete items first
            if (existingDetail.items && existingDetail.items.length > 0) {
                for (const itemId of existingDetail.items) {
                    await dbAdapter.localSaleDetailItemAdapter.removePermanently(itemId, { session: transaction.session });
                }
            }
            // Then delete the detail
            await dbAdapter.localSaleDetailAdapter.removePermanently(existingDetail.id, { session: transaction.session });
        }

        // Delete existing local company detail and its items permanently
        if (existingLocalSale.localCompanySaleDetail) {
            const existingCompanyDetail = await dbAdapter.localCompanySaleDetailAdapter.getById(existingLocalSale.localCompanySaleDetail);
            if (existingCompanyDetail) {
                // Delete items first
                if (existingCompanyDetail.items && existingCompanyDetail.items.length > 0) {
                    for (const itemId of existingCompanyDetail.items) {
                        await dbAdapter.localCompanySaleDetailItemAdapter.removePermanently(itemId, { session: transaction.session });
                    }
                }
                // Then delete the company detail
                await dbAdapter.localCompanySaleDetailAdapter.removePermanently(existingCompanyDetail.id, { session: transaction.session });
            }
        }

        // Create new local sale details (multiple objects) with reference to localSale
        if (localSaleDetails && localSaleDetails.length > 0) {
            for (const localSaleDetail of localSaleDetails) {
                const itemIds = [];

                for (const item of localSaleDetail.items) {
                    const createdItem = await dbAdapter.localSaleDetailItemAdapter.create(item, { session: transaction.session });
                    itemIds.push(createdItem.id);
                }

                await dbAdapter.localSaleDetailAdapter.create({
                    localSale: existingLocalSale.id,
                    style: localSaleDetail.style,
                    grandTotal: localSaleDetail.grandTotal,
                    receivedGrandTotal: localSaleDetail.receivedGrandTotal,
                    poundsGrandTotal: localSaleDetail.poundsGrandTotal,
                    retentionPercentage: localSaleDetail.retentionPercentage,
                    retentionAmount: localSaleDetail.retentionAmount,
                    netGrandTotal: localSaleDetail.netGrandTotal,
                    otherPenalties: localSaleDetail.otherPenalties,
                    items: itemIds
                }, { session: transaction.session });
            }
        }

        // Handle local company detail (single object)
        let localCompanySaleDetailId = null;

        if (localCompanySaleDetail) {
            const companyItemIds = [];

            for (const item of localCompanySaleDetail.items) {
                const createdItem = await dbAdapter.localCompanySaleDetailItemAdapter.create(item, { session: transaction.session });
                companyItemIds.push(createdItem.id);
            }

            const createdCompanyDetail = await dbAdapter.localCompanySaleDetailAdapter.create({
                company: localCompanySaleDetail.company,
                receiptDate: localCompanySaleDetail.receiptDate,
                personInCharge: localCompanySaleDetail.personInCharge,
                batch: localCompanySaleDetail.batch,
                guideWeight: localCompanySaleDetail.guideWeight,
                guideNumber: localCompanySaleDetail.guideNumber,
                weightDifference: localCompanySaleDetail.weightDifference,
                processedWeight: localCompanySaleDetail.processedWeight,
                poundsGrandTotal: localCompanySaleDetail.poundsGrandTotal,
                grandTotal: localCompanySaleDetail.grandTotal,
                retentionPercentage: localCompanySaleDetail.retentionPercentage,
                retentionAmount: localCompanySaleDetail.retentionAmount,
                netGrandTotal: localCompanySaleDetail.netGrandTotal,
                otherPenalties: localCompanySaleDetail.otherPenalties,
                items: companyItemIds
            }, { session: transaction.session });

            localCompanySaleDetailId = createdCompanyDetail.id;
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
            localCompanySaleDetail: localCompanySaleDetailId
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
