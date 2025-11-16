const dbAdapter = require('../adapters');
const SaleTypeEnum = require('../enums/sale-type.enum');
const LocalSaleStatusEnum = require('../enums/local-sale-status.enum');

const normalize = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

/**
 * Determines the local sale status based on payment information
 * @param {Array} localSaleDetails - Array of local sale details with items
 * @param {String} localCompanySaleDetailId - ID of local company sale detail (optional)
 * @param {Number} companyDetailNetGrandTotal - Net grand total for company detail
 * @returns {String} Status: CREATED, IN_PROGRESS, or COMPLETED
 */
const determineLocalSaleStatus = async (localSaleDetails, localCompanySaleDetailId, companyDetailNetGrandTotal = 0) => {
    let hasAnyPayment = false;
    let allPaid = true;
    let hasAnyItems = false;

    // Check local sale details (WHOLE and TAIL)
    if (localSaleDetails && localSaleDetails.length > 0) {
        for (const detail of localSaleDetails) {
            if (detail.items && detail.items.length > 0) {
                for (const item of detail.items) {
                    hasAnyItems = true;
                    if (item.paymentStatus === 'PAID') {
                        hasAnyPayment = true;
                    } else {
                        allPaid = false;
                    }
                }
            }
        }
    }

    // Check local company sale detail payments
    if (localCompanySaleDetailId && companyDetailNetGrandTotal > 0) {
        // Company detail exists and has items (netGrandTotal > 0)
        hasAnyItems = true;

        const companyPayments = await dbAdapter.localCompanySaleDetailPaymentAdapter.getAll({
            localCompanySaleDetail: localCompanySaleDetailId,
            deletedAt: null
        });

        if (companyPayments && companyPayments.length > 0) {
            hasAnyPayment = true;

            // Check if company detail is fully paid
            const totalCompanyPaid = normalize(companyPayments.reduce((sum, pm) => sum + Number(pm.amount), 0));
            if (totalCompanyPaid < companyDetailNetGrandTotal) {
                allPaid = false;
            }
            // If totalCompanyPaid >= companyDetailNetGrandTotal, allPaid stays true (if not already false from items)
        } else {
            // No company payments but has company detail with items
            allPaid = false;  // Company detail not paid yet
        }
    }

    // Determine status
    if (!hasAnyPayment) {
        return LocalSaleStatusEnum.CREATED;
    }

    if (allPaid && hasAnyItems) {
        return LocalSaleStatusEnum.COMPLETED;
    }

    return LocalSaleStatusEnum.IN_PROGRESS;
};

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
            localCompanySaleDetail,
            status: inputStatus
        } = data;

        // Determine initial status - default to CREATED for backward compatibility
        const initialStatus = inputStatus || LocalSaleStatusEnum.CREATED;

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
        // Use purchase's weightSheetNumber or fallback to 'DRAFT' to satisfy Sale model requirement
        const effectiveWeightSheetNumber = weightSheetNumber || purchaseExists.weightSheetNumber || 'DRAFT';

        const sale = await dbAdapter.saleAdapter.create({
            purchase,
            saleDate,
            weightSheetNumber: effectiveWeightSheetNumber,
            type: SaleTypeEnum.LOCAL
        }, { session: transaction.session });

        // Create local sale first with initial status (CREATED by default or provided)
        // We'll update it after creating company detail if needed (for non-DRAFT statuses)
        const localSale = await dbAdapter.localSaleAdapter.create({
            sale: sale.id,
            status: initialStatus,
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
        let createdCompanySaleDetailId = null;

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

            createdCompanySaleDetailId = createdCompanyDetail.id;

            // Update localSale with company detail reference
            await dbAdapter.localSaleAdapter.update(localSale.id, {
                localCompanySaleDetail: createdCompanyDetail.id
            }, { session: transaction.session });
        }

        // For non-DRAFT statuses, recalculate status with all details created (including company detail ID)
        if (initialStatus !== LocalSaleStatusEnum.DRAFT) {
            const createdLocalSaleDetailList = await dbAdapter.localSaleDetailAdapter.getAllWithRelations(
                { localSale: localSale.id, deletedAt: null },
                [{ path: 'items' }]
            );

            const finalStatus = await determineLocalSaleStatus(
                createdLocalSaleDetailList,
                createdCompanySaleDetailId, // Use the created company detail ID (not from localSale object)
                localCompanySaleDetail?.netGrandTotal || 0
            );

            // Update status if it changed from initial
            if (finalStatus !== initialStatus) {
                await dbAdapter.localSaleAdapter.update(localSale.id, {
                    status: finalStatus
                }, { session: transaction.session });
            }
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
        status: localSale.status,
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
            weightSheetNumber: purchase.weightSheetNumber,
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
    // Allow status-only updates (e.g., switching to/from DRAFT) similar to company-sale.service
    if (Object.keys(data).length === 1 && data.status) {
        return await updateStatus(id, data.status);
    }

    let transaction;

    try {
        transaction = await dbAdapter.localSaleAdapter.startTransaction();
        const existingLocalSale = await dbAdapter.localSaleAdapter.getById(id);
        if (!existingLocalSale) throw new Error('Local Sale not found');

        const sale = await dbAdapter.saleAdapter.getById(existingLocalSale.sale);
        if (!sale) throw new Error('Associated Sale not found');

        const { saleDate, wholeTotalPounds, moneyIncomeForRejectedHeads, wholeRejectedPounds, trashPounds, totalProcessedPounds, grandTotal, seller, weightSheetNumber, hasInvoice, invoiceNumber, invoiceName, localSaleDetails, localCompanySaleDetail, status: inputStatus } = data;

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

        // Delete existing local company detail ITEMS only (keep the detail to preserve payment references)
        if (existingLocalSale.localCompanySaleDetail) {
            const existingCompanyDetail = await dbAdapter.localCompanySaleDetailAdapter.getById(existingLocalSale.localCompanySaleDetail);
            if (existingCompanyDetail) {
                // Delete items first
                if (existingCompanyDetail.items && existingCompanyDetail.items.length > 0) {
                    for (const itemId of existingCompanyDetail.items) {
                        await dbAdapter.localCompanySaleDetailItemAdapter.removePermanently(itemId, { session: transaction.session });
                    }
                }
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

        // Handle local company detail (update existing or create new)
        let localCompanySaleDetailId = existingLocalSale.localCompanySaleDetail;

        if (localCompanySaleDetail) {
            const companyItemIds = [];

            for (const item of localCompanySaleDetail.items) {
                const createdItem = await dbAdapter.localCompanySaleDetailItemAdapter.create(item, { session: transaction.session });
                companyItemIds.push(createdItem.id);
            }

            if (localCompanySaleDetailId) {
                // Update existing company detail to preserve payment references
                await dbAdapter.localCompanySaleDetailAdapter.update(localCompanySaleDetailId, {
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
            } else {
                // Create new company detail if it didn't exist before
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
        } else if (existingLocalSale.localCompanySaleDetail) {
            // If localCompanySaleDetail was removed (user deleted it), delete the company detail and its payments
            const existingCompanyDetail = await dbAdapter.localCompanySaleDetailAdapter.getById(existingLocalSale.localCompanySaleDetail);
            if (existingCompanyDetail) {
                // Delete all associated payments first
                const existingPayments = await dbAdapter.localCompanySaleDetailPaymentAdapter.getAll({
                    localCompanySaleDetail: existingLocalSale.localCompanySaleDetail,
                    deletedAt: null
                });
                for (const payment of existingPayments) {
                    await dbAdapter.localCompanySaleDetailPaymentAdapter.removePermanently(payment.id, { session: transaction.session });
                }

                // Then delete the company detail
                await dbAdapter.localCompanySaleDetailAdapter.removePermanently(existingCompanyDetail.id, { session: transaction.session });
            }
            localCompanySaleDetailId = null;
        }

        // Recalculate status based on updated payment information
        // Need to get the created details to check their items' payment status
        const updatedLocalSaleDetailList = await dbAdapter.localSaleDetailAdapter.getAllWithRelations(
            { localSale: existingLocalSale.id, deletedAt: null },
            [{ path: 'items' }]
        );

        const updatedStatus = await determineLocalSaleStatus(
            updatedLocalSaleDetailList,
            localCompanySaleDetailId,
            localCompanySaleDetail?.netGrandTotal || 0
        );

        // Respect explicit DRAFT status if requested; otherwise use calculated status
        const finalStatus = inputStatus === LocalSaleStatusEnum.DRAFT
            ? LocalSaleStatusEnum.DRAFT
            : updatedStatus;

        // Update local sale
        const updatedLocalSale = await dbAdapter.localSaleAdapter.update(id, {
            status: finalStatus,
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


/**
 * Recalculates and updates the status of a local sale
 * Called by payment service when payments are created/updated/deleted
 * @param {String} localSaleId - ID of the local sale to update
 * @param {Object} session - Optional transaction session
 */
const recalculateAndUpdateStatus = async (localSaleId, session = null) => {
    try {
        const localSale = await dbAdapter.localSaleAdapter.getById(localSaleId);
        if (!localSale) throw new Error('Local Sale not found');

        // If sale is in DRAFT, keep it there regardless of payments
        if (localSale.status === LocalSaleStatusEnum.DRAFT) {
            return LocalSaleStatusEnum.DRAFT;
        }

        // Get local sale details with items
        const localSaleDetailList = await dbAdapter.localSaleDetailAdapter.getAllWithRelations(
            { localSale: localSaleId, deletedAt: null },
            [{ path: 'items' }]
        );

        // Get company detail if exists
        let companyDetailNetGrandTotal = 0;
        if (localSale.localCompanySaleDetail) {
            const companyDetail = await dbAdapter.localCompanySaleDetailAdapter.getById(localSale.localCompanySaleDetail);
            if (companyDetail) {
                companyDetailNetGrandTotal = companyDetail.netGrandTotal || 0;
            }
        }

        // Calculate new status
        const newStatus = await determineLocalSaleStatus(
            localSaleDetailList,
            localSale.localCompanySaleDetail,
            companyDetailNetGrandTotal
        );

        // Update status if changed
        if (localSale.status !== newStatus) {
            await dbAdapter.localSaleAdapter.update(
                localSaleId,
                { status: newStatus },
                session ? { session } : {}
            );
        }

        return newStatus;
    } catch (error) {
        console.error('Error recalculating status:', error);
        throw error;
    }
};

/**
 * Updates only the status field of a local sale
 * Similar to company-sale.service updateStatus
 * @param {String} id - Local sale ID
 * @param {String} status - New status
 */
const updateStatus = async (id, status) => {
    const existingLocalSale = await dbAdapter.localSaleAdapter.getById(id);
    if (!existingLocalSale) {
        throw new Error('Local Sale not found');
    }

    const updatedLocalSale = await dbAdapter.localSaleAdapter.update(id, { status });
    return updatedLocalSale;
};

module.exports = { create, getBySaleId, update, recalculateAndUpdateStatus, updateStatus };
