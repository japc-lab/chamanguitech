const dbAdapter = require('../adapters');
const CompanySaleStatusEnum = require('../enums/company-sale-status.enum');

const normalize = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const determineStatus = (totalPaid, totalToReceive) => {
    // Normalize both values to handle floating point precision
    const normalizedPaid = normalize(totalPaid);
    const normalizedToReceive = normalize(totalToReceive);

    if (normalizedPaid === 0) return CompanySaleStatusEnum.CREATED;
    if (normalizedPaid >= normalizedToReceive) return CompanySaleStatusEnum.COMPLETED;
    return CompanySaleStatusEnum.IN_PROGRESS;
};

const createPaymentMethod = async (data) => {
    const transaction = await dbAdapter.companySalePaymentMethodAdapter.startTransaction();
    try {
        const companySale = await dbAdapter.companySaleAdapter.getById(data.companySale);
        if (!companySale) throw new Error('CompanySale does not exist');

        const paymentMethod = await dbAdapter.paymentMethodAdapter.getById(data.paymentMethod);
        if (!paymentMethod) throw new Error('Payment Method does not exist');

        // Validate payment amount
        if (!data.amount || Number(data.amount) <= 0) {
            throw new Error('Payment amount must be greater than 0');
        }

        const existingPayments = await dbAdapter.companySalePaymentMethodAdapter.getAll({
            companySale: data.companySale,
            deletedAt: null
        });
        const totalPaid = normalize(existingPayments.reduce((sum, pm) => sum + Number(pm.amount), 0) + Number(data.amount));

        // Validate grand total is valid
        if (!companySale.grandTotal || companySale.grandTotal <= 0) {
            throw new Error('Company sale grand total must be greater than 0 to accept payments');
        }

        if (totalPaid > companySale.grandTotal) {
            throw new Error(`Total payments (${totalPaid}) cannot exceed the expected amount of ${companySale.grandTotal}`);
        }

        const newPayment = await dbAdapter.companySalePaymentMethodAdapter.create(data, { session: transaction.session });

        const newStatus = determineStatus(totalPaid, companySale.grandTotal);
        if (companySale.status !== newStatus) {
            await dbAdapter.companySaleAdapter.update(companySale.id, { status: newStatus }, { session: transaction.session });
        }

        await transaction.commit();
        return newPayment;
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

const updatePaymentMethod = async (id, data) => {
    const transaction = await dbAdapter.companySalePaymentMethodAdapter.startTransaction();
    try {
        const payment = await dbAdapter.companySalePaymentMethodAdapter.getById(id);
        if (!payment) throw new Error('Payment method not found');

        const companySale = await dbAdapter.companySaleAdapter.getById(payment.companySale);
        if (!companySale) throw new Error('Associated CompanySale does not exist');

        if (data.paymentMethod) {
            const paymentMethod = await dbAdapter.paymentMethodAdapter.getById(data.paymentMethod);
            if (!paymentMethod) throw new Error('New payment method does not exist');
        }

        // Validate payment amount if being updated
        if (data.amount !== undefined && Number(data.amount) <= 0) {
            throw new Error('Payment amount must be greater than 0');
        }

        const existingPayments = await dbAdapter.companySalePaymentMethodAdapter.getAll({
            companySale: payment.companySale,
            _id: { $ne: id },
            deletedAt: null
        });

        const totalPaid = normalize(existingPayments.reduce((sum, pm) => sum + Number(pm.amount), 0) + (data.amount ? Number(data.amount) : Number(payment.amount)));

        // Validate grand total is valid
        if (!companySale.grandTotal || companySale.grandTotal <= 0) {
            throw new Error('Company sale grand total must be greater than 0 to accept payments');
        }

        if (totalPaid > companySale.grandTotal) {
            throw new Error(`Total payments (${totalPaid}) cannot exceed the expected amount of ${companySale.grandTotal}`);
        }

        await dbAdapter.companySalePaymentMethodAdapter.update(id, data, { session: transaction.session });

        const newStatus = determineStatus(totalPaid, companySale.grandTotal);
        if (companySale.status !== newStatus) {
            await dbAdapter.companySaleAdapter.update(companySale.id, { status: newStatus }, { session: transaction.session });
        }

        await transaction.commit();
        return { id, ...data };
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

const getPaymentsByCompanySale = async (companySaleId) => {
    const query = {
        ...(companySaleId && { companySale: companySaleId }),
        deletedAt: null
    };
    return await dbAdapter.companySalePaymentMethodAdapter.getAllWithRelations(query, ['paymentMethod']);
};

const removePaymentMethod = async (id) => {
    const transaction = await dbAdapter.companySalePaymentMethodAdapter.startTransaction();
    try {
        const payment = await dbAdapter.companySalePaymentMethodAdapter.getById(id);
        if (!payment) throw new Error('Payment method not found');

        const companySale = await dbAdapter.companySaleAdapter.getById(payment.companySale);
        if (!companySale) throw new Error('Associated CompanySale does not exist');

        // ❌ Permanently delete payment method
        await dbAdapter.companySalePaymentMethodAdapter.removePermanently(id);

        // ✅ Get remaining active payments
        const remainingPayments = await dbAdapter.companySalePaymentMethodAdapter.getAll({
            companySale: payment.companySale,
            deletedAt: null
        });

        const totalPaid = normalize(remainingPayments.reduce((sum, pm) => sum + Number(pm.amount), 0));
        const newStatus = determineStatus(totalPaid, companySale.grandTotal);

        if (companySale.status !== newStatus) {
            await dbAdapter.companySaleAdapter.update(companySale.id, { status: newStatus }, { session: transaction.session });
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};


module.exports = {
    createPaymentMethod,
    getPaymentsByCompanySale,
    updatePaymentMethod,
    removePaymentMethod
};
