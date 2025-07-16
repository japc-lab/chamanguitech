const dbAdapter = require('../adapters');
const CompanySaleStatusEnum = require('../enums/company-sale-status.enum');
const LogisticsStatusEnum = require('../enums/logistics-status.enum');
const PurchaseStatusEnum = require('../enums/purchase-status.enum');

const getEconomicReportByParams = async ({ includeDeleted = false, clientId, userId, periodId, controlNumber }) => {
    const query = includeDeleted ? {} : { deletedAt: null };
    if (clientId) query.client = clientId;
    if (userId) query.buyer = userId;
    if (periodId) query.period = periodId;
    if (controlNumber) query.controlNumber = controlNumber;

    const purchases = await dbAdapter.purchaseAdapter.getAllWithRelations(query, [
        'buyer', 'broker', 'client', 'shrimpFarm', 'company', 'period'
    ]);

    const purchase = purchases.find(p => !p.deletedAt);
    if (!purchase) return null;

    const persons = await dbAdapter.personAdapter.getAll({
        _id: [
            purchase.buyer?.person,
            purchase.broker?.person,
            purchase.client?.person
        ].filter(Boolean)
    });
    const personMap = persons.reduce((acc, p) => {
        acc[p.id] = `${p.names} ${p.lastNames}`.trim();
        return acc;
    }, {});

    const sales = await dbAdapter.saleAdapter.getAll({ purchase: purchase.id, deletedAt: null });
    const sale = sales.find(s => !s.deletedAt);
    if (!sale) return null;

    const [companySales, localSales] = await Promise.all([
        dbAdapter.companySaleAdapter.getAll({ sale: sale.id, deletedAt: null }),
        dbAdapter.localSaleAdapter.getAll({ sale: sale.id, deletedAt: null })
    ]);

    const companySale = companySales.find(cs => !cs.deletedAt);
    const localSale = localSales.find(ls => !ls.deletedAt);
    const isCompany = !!companySale;

    const logisticsList = await dbAdapter.logisticsAdapter.getAllWithRelations(
        { purchase: purchase.id, deletedAt: null },
        [{ path: 'items', populate: { path: 'logisticsCategory' } }]
    );

    const logisticsProcessed = logisticsList
        .filter(l => !l.deletedAt)
        .map(log => {
            const grouped = log.items.reduce((acc, item) => {
                if (!item?.logisticsCategory) return acc;
                const category = item.logisticsCategory.category;
                acc[category] = (acc[category] || 0) + item.total;
                return acc;
            }, {});
            return {
                id: log.id,
                type: log.type,
                logisticsDate: log.logisticsDate,
                personnelExpenses: grouped.PERSONNEL || 0,
                productAndSupplyExpenses: grouped.INPUTS || 0,
                totalToPay: (grouped.PERSONNEL || 0) + (grouped.INPUTS || 0)
            };
        });

    // Calculate total logistics cost
    const totalLogisticsCost = isCompany
        ? (logisticsProcessed[0]?.totalToPay || 0)
        : logisticsProcessed.reduce((sum, l) => sum + (l.totalToPay || 0), 0);

    // Calculate grossProfit correctly depending on company or local
    const grossProfit = ((isCompany ? companySale?.grandTotal : localSale?.grandTotal) || 0)
        - totalLogisticsCost
        - (purchase.totalAgreedToPay || 0);

    return {
        grossProfit,
        purchase: {
            clientName: personMap[purchase.client?.person] || '',
            shrimpFarmLocation: purchase.shrimpFarm?.place || '',
            shrimpFarm: purchase.shrimpFarm?.identifier || '',
            responsibleBuyer: personMap[purchase.buyer?.person] || '',
            controlNumber: purchase.controlNumber || '',
            companyName: purchase.company?.name || '',
            period: purchase.period?.name || '',
            brokerName: personMap[purchase.broker?.person] || '',
            purchaseDate: purchase.purchaseDate || '',
            averageGram: purchase.averageGrams || 0,
            invoiceNumber: purchase.invoice || '',
            status: purchase.status || '',
            price: purchase.price || 0,
            pounds: purchase.pounds || 0,
            averageGrams2: purchase.averageGrams2 || 0,
            price2: purchase.price2 || 0,
            pounds2: purchase.pounds2 || 0,
            totalPoundsPurchased: purchase.totalPounds || 0,
            totalToPay: purchase.grandTotal,
            totalAgreed: purchase.totalAgreedToPay || 0
        },
        sale: isCompany ? {
            saleDate: sale?.saleDate || '',
            receptionDate: companySale?.receptionDateTime || '',
            batch: companySale?.batch || '',
            document: companySale?.document || '',
            averageBatchGrams: companySale?.batchAverageGram || 0,
            netPoundsReceived: companySale?.netReceivedPounds || 0,
            wholePoundsReceived: companySale?.wholeReceivedPounds || 0,
            trashPounds: companySale?.trashPounds || 0,
            performance: companySale?.performance || 0,
            totalToReceive: companySale?.grandTotal || 0
        } : {
            saleDate: sale?.saleDate || '',
            wholeTotalPounds: localSale?.wholeTotalPounds || 0,
            tailTotalPounds: localSale?.tailTotalPounds || 0,
            wholeRejectedPounds: localSale?.wholeRejectedPounds || 0,
            trashPounds: localSale?.trashPounds || 0,
            totalProcessedPounds: localSale?.totalProcessedPounds || 0,
            totalToReceive: localSale?.grandTotal || 0
        },
        logistics: isCompany
            ? (logisticsProcessed[0] || null) // Company: single logistics
            : logisticsProcessed,             // Local: array of logistics
        isCompanySale: isCompany
    };
};

const getTotalReportByParams = async ({ includeDeleted = false, clientId, userId, periodId, controlNumber }) => {
    const query = includeDeleted ? {} : { deletedAt: null };
    if (clientId) query.client = clientId;
    if (userId) query.buyer = userId;
    if (periodId) query.period = periodId;
    if (controlNumber) query.controlNumber = controlNumber;

    // Fetch purchase with relations
    const purchases = await dbAdapter.purchaseAdapter.getAllWithRelations(query, [
        'buyer', 'broker', 'client', 'shrimpFarm', 'company', 'period'
    ]);
    const purchase = purchases.find(p => !p.deletedAt);
    if (!purchase) return null;

    // Fetch persons for buyer, broker, client
    const persons = await dbAdapter.personAdapter.getAll({
        _id: [
            purchase.buyer?.person,
            purchase.broker?.person,
            purchase.client?.person
        ].filter(Boolean)
    });
    const personMap = persons.reduce((acc, p) => {
        acc[p.id] = `${p.names} ${p.lastNames}`.trim();
        return acc;
    }, {});

    // Fetch sale
    const sales = await dbAdapter.saleAdapter.getAll({ purchase: purchase.id, deletedAt: null });
    const sale = sales.find(s => !s.deletedAt);
    if (!sale) return null;

    // Fetch only CompanySale
    const companySales = await dbAdapter.companySaleAdapter.getAll({ sale: sale.id, deletedAt: null });
    const companySale = companySales.find(cs => !cs.deletedAt);
    if (!companySale) return null;

    // Fetch logistics
    const logisticsList = await dbAdapter.logisticsAdapter.getAllWithRelations(
        { purchase: purchase.id, deletedAt: null },
        [{ path: 'items', populate: { path: 'logisticsCategory' } }]
    );

    const logisticsRecord = logisticsList.find(l => !l.deletedAt);
    let logisticsData = null;
    if (logisticsRecord) {
        const grouped = logisticsRecord.items.reduce((acc, item) => {
            if (!item?.logisticsCategory) return acc;
            const category = item.logisticsCategory.category;
            acc[category] = (acc[category] || 0) + item.total;
            return acc;
        }, {});

        logisticsData = {
            id: logisticsRecord.id,
            type: logisticsRecord.type,
            logisticsDate: logisticsRecord.logisticsDate,
            personnelExpenses: grouped.PERSONNEL || 0,
            productAndSupplyExpenses: grouped.INPUTS || 0,
            totalToPay: (grouped.PERSONNEL || 0) + (grouped.INPUTS || 0)
        };
    }

    return {
        purchase: {
            id: purchase.id,
            clientName: personMap[purchase.client?.person] || '',
            shrimpFarmLocation: purchase.shrimpFarm?.place || '',
            shrimpFarm: purchase.shrimpFarm?.identifier || '',
            responsibleBuyer: personMap[purchase.buyer?.person] || '',
            controlNumber: purchase.controlNumber || '',
            companyName: purchase.company?.name || '',
            period: purchase.period?.name || '',
            brokerName: personMap[purchase.broker?.person] || '',
            purchaseDate: purchase.purchaseDate || '',
            averageGram: purchase.averageGrams || 0,
            price: purchase.price || 0,
            pounds: purchase.pounds || 0,
            averageGrams2: purchase.averageGrams2 || 0,
            price2: purchase.price2 || 0,
            pounds2: purchase.pounds2 || 0,
            totalPoundsPurchased: purchase.totalPounds || 0,
            totalToPay: purchase.grandTotal,
            totalAgreed: purchase.totalAgreedToPay || 0
        },
        sale: {
            saleDate: sale?.saleDate || '',
            averageBatchGrams: companySale?.batchAverageGram || 0,
            netPoundsReceived: companySale?.netReceivedPounds || 0,
            wholePoundsReceived: companySale?.wholeReceivedPounds || 0,
            trashPounds: companySale?.trashPounds || 0,
            totalToReceive: companySale?.grandTotal || 0
        },
        logistics: logisticsData
    };
};

const createTotalReport = async (data) => {
    const transaction = await dbAdapter.totalReportAdapter.startTransaction();

    try {
        const { purchaseId } = data;

        // 📄 Create TotalReport
        const totalReport = await dbAdapter.totalReportAdapter.create(data, { session: transaction.session });

        // 🔍 Find and Update Purchase
        const purchase = await dbAdapter.purchaseAdapter.getById(purchaseId);
        if (!purchase) {
            throw new Error('Purchase not found');
        }
        await dbAdapter.purchaseAdapter.update(purchaseId, { status: PurchaseStatusEnum.CLOSED }, { session: transaction.session });

        // 🔍 Find Sale associated to Purchase
        const saleList = await dbAdapter.saleAdapter.getAll({ purchase: purchaseId, deletedAt: null });
        const sale = saleList[0];
        if (!sale) {
            throw new Error('Sale not found for purchase');
        }

        // 🔍 Find CompanySale (only CompanySale, ignore LocalSale)
        const companySaleList = await dbAdapter.companySaleAdapter.getAll({ sale: sale.id, deletedAt: null });
        const companySale = companySaleList[0];
        if (companySale) {
            await dbAdapter.companySaleAdapter.update(companySale.id, { status: CompanySaleStatusEnum.CLOSED }, { session: transaction.session });
        }

        // 🔍 Find Logistics associated to Purchase
        const logisticsList = await dbAdapter.logisticsAdapter.getAll({ purchase: purchaseId, deletedAt: null });
        await Promise.all(
            logisticsList.map(logistics =>
                dbAdapter.logisticsAdapter.update(logistics.id, { status: LogisticsStatusEnum.CLOSED }, { session: transaction.session })
            )
        );

        await transaction.commit();
        return totalReport;
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

const getRecordedTotalReportByControlNumber = async (controlNumber) => {
    const reportList = await dbAdapter.totalReportAdapter.getAll({ controlNumber });

    const report = reportList[0];
    return report || null;
};

module.exports = {
    getEconomicReportByParams,
    getTotalReportByParams,
    createTotalReport,
    getRecordedTotalReportByControlNumber
};
