const dbAdapter = require('../adapters');

const getAllByParams = async ({ userId, controlNumber, includeDeleted = false }) => {
    const saleQuery = includeDeleted ? {} : { deletedAt: null };

    const purchaseQuery = {};
    if (userId) purchaseQuery.buyer = userId;
    if (controlNumber) purchaseQuery.controlNumber = controlNumber;

    const purchases = await dbAdapter.purchaseAdapter.getAllWithRelations(purchaseQuery, ['buyer', 'client', 'company']);
    const purchaseIds = purchases.map(p => p.id);

    if ((userId || controlNumber) && purchaseIds.length === 0) return [];

    if (purchaseIds.length > 0) {
        saleQuery.purchase = { $in: purchaseIds };
    }

    const personIds = purchases.flatMap(p => [
        p.buyer?.person,
        p.client?.person
    ]).filter(Boolean);

    const persons = await dbAdapter.personAdapter.getAll({ _id: { $in: personIds } });
    const personMap = persons.reduce((acc, p) => {
        acc[p.id] = `${p.names} ${p.lastNames}`.trim();
        return acc;
    }, {});

    const purchaseMap = purchases.reduce((acc, p) => {
        acc[p.id] = {
            controlNumber: p.controlNumber,
            buyer: p.buyer ? { id: p.buyer.id, fullName: personMap[p.buyer.person] || 'Unknown' } : null,
            client: p.client ? { id: p.client.id, fullName: personMap[p.client.person] || 'Unknown' } : null,
            company: p.company ? { id: p.company.id, name: p.company.name } : null,
        };
        return acc;
    }, {});

    const sales = await dbAdapter.saleAdapter.getAllWithRelations(saleQuery, ['purchase']);
    const saleIds = sales.map(s => s.id);

    const [companySales, localSales] = await Promise.all([
        dbAdapter.companySaleAdapter.getAll({ sale: { $in: saleIds }, deletedAt: null }),
        dbAdapter.localSaleAdapter.getAll({ sale: { $in: saleIds }, deletedAt: null })
    ]);

    const companySaleMap = companySales.reduce((acc, cs) => {
        acc[cs.sale.toString()] = cs;
        return acc;
    }, {});

    const localSaleMap = localSales.reduce((acc, ls) => {
        acc[ls.sale.toString()] = ls;
        return acc;
    }, {});

    const companySaleIds = companySales.map(cs => cs.id);

    const payments = await dbAdapter.companySalePaymentMethodAdapter.getAll({
        companySale: { $in: companySaleIds },
        deletedAt: null
    });

    const paymentMap = payments.reduce((map, payment) => {
        const saleId = payment.companySale.toString();
        map[saleId] = (map[saleId] || 0) + Number(payment.amount);
        return map;
    }, {});

    return sales.map(sale => {
        const purchaseData = purchaseMap[sale.purchase?.id];
        const relatedCompanySale = companySaleMap[sale.id] || null;
        const relatedLocalSale = localSaleMap[sale.id] || null;

        const isCompany = relatedCompanySale !== null;
        const relatedSale = isCompany ? relatedCompanySale : relatedLocalSale;

        const totalPaid = isCompany ? (paymentMap[relatedSale?.id] || 0) : null;
        const grandTotal = relatedSale?.grandTotal || 0;
        const paidPercentage = isCompany && grandTotal > 0
            ? Math.round((totalPaid / grandTotal) * 10000) / 100 // rounded to 2 decimals
            : null;

        return {
            id: sale.id,
            saleDate: sale.saleDate,
            type: sale.type,
            controlNumber: purchaseData?.controlNumber || null,
            total: grandTotal,
            totalPaid,
            paidPercentage,
            status: relatedSale?.status || null,
            buyer: purchaseData?.buyer || null,
            client: purchaseData?.client || null,
            company: purchaseData?.company || null,
            isCompanySale: isCompany
        };
    });
};



const remove = async (id) => {
    const transaction = await dbAdapter.saleAdapter.startTransaction();

    try {
        const sale = await dbAdapter.saleAdapter.getById(id);
        if (!sale) {
            throw new Error('Sale not found');
        }

        const deletedAt = new Date();

        // 🔹 Soft delete the Sale
        await dbAdapter.saleAdapter.update(id, { deletedAt }, { session: transaction.session });

        // 🔹 Determine sale type and delete associated record
        if (sale.type === 'COMPANY') {
            const companySales = await dbAdapter.companySaleAdapter.getAll({ sale: id });
            await Promise.all(companySales.map(cs =>
                dbAdapter.companySaleAdapter.update(cs.id, { deletedAt }, { session: transaction.session })
            ));
        }

        if (sale.type === 'LOCAL') {
            const localSales = await dbAdapter.localSaleAdapter.getAll({ sale: id });
            await Promise.all(localSales.map(ls =>
                dbAdapter.localSaleAdapter.update(ls.id, { deletedAt }, { session: transaction.session })
            ));
        }

        await transaction.commit();
        return { id, deletedAt };
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};



module.exports = {
    getAllByParams,
    remove,
};
