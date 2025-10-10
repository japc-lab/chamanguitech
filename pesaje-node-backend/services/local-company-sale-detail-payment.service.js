const dbAdapter = require('../adapters');

const normalize = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const createPayment = async (data) => {
    const transaction = await dbAdapter.localCompanySaleDetailPaymentAdapter.startTransaction();
    try {
        const localCompanySaleDetail = await dbAdapter.localCompanySaleDetailAdapter.getById(data.localCompanySaleDetail);
        if (!localCompanySaleDetail) throw new Error('Local Company Sale Detail does not exist');

        const paymentMethod = await dbAdapter.paymentMethodAdapter.getById(data.paymentMethod);
        if (!paymentMethod) throw new Error('Payment Method does not exist');

        const existingPayments = await dbAdapter.localCompanySaleDetailPaymentAdapter.getAll({ 
            localCompanySaleDetail: data.localCompanySaleDetail,
            deletedAt: null 
        });
        const totalPaid = normalize(existingPayments.reduce((sum, pm) => sum + Number(pm.amount), 0) + Number(data.amount));

        if (totalPaid > localCompanySaleDetail.netGrandTotal) {
            throw new Error(`Total payments cannot exceed the net grand total amount of ${localCompanySaleDetail.netGrandTotal}`);
        }

        const newPayment = await dbAdapter.localCompanySaleDetailPaymentAdapter.create(data, { session: transaction.session });

        await transaction.commit();
        return newPayment;
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

const updatePayment = async (id, data) => {
    const transaction = await dbAdapter.localCompanySaleDetailPaymentAdapter.startTransaction();
    try {
        const payment = await dbAdapter.localCompanySaleDetailPaymentAdapter.getById(id);
        if (!payment) throw new Error('Payment not found');

        const localCompanySaleDetail = await dbAdapter.localCompanySaleDetailAdapter.getById(payment.localCompanySaleDetail);
        if (!localCompanySaleDetail) throw new Error('Associated Local Company Sale Detail does not exist');

        if (data.paymentMethod) {
            const paymentMethod = await dbAdapter.paymentMethodAdapter.getById(data.paymentMethod);
            if (!paymentMethod) throw new Error('New payment method does not exist');
        }

        const existingPayments = await dbAdapter.localCompanySaleDetailPaymentAdapter.getAll({
            localCompanySaleDetail: payment.localCompanySaleDetail,
            _id: { $ne: id },
            deletedAt: null
        });

        const totalPaid = normalize(existingPayments.reduce((sum, pm) => sum + Number(pm.amount), 0) + (data.amount ? Number(data.amount) : Number(payment.amount)));

        if (totalPaid > localCompanySaleDetail.netGrandTotal) {
            throw new Error(`Total payments cannot exceed the net grand total amount of ${localCompanySaleDetail.netGrandTotal}`);
        }

        await dbAdapter.localCompanySaleDetailPaymentAdapter.update(id, data, { session: transaction.session });

        await transaction.commit();
        return { id, ...data };
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

const getPaymentsByLocalCompanySaleDetail = async (localCompanySaleDetailId) => {
    const query = {
        ...(localCompanySaleDetailId && { localCompanySaleDetail: localCompanySaleDetailId }),
        deletedAt: null
    };
    return await dbAdapter.localCompanySaleDetailPaymentAdapter.getAllWithRelations(query, ['paymentMethod']);
};

const removePayment = async (id) => {
    const transaction = await dbAdapter.localCompanySaleDetailPaymentAdapter.startTransaction();
    try {
        const payment = await dbAdapter.localCompanySaleDetailPaymentAdapter.getById(id);
        if (!payment) throw new Error('Payment not found');

        const localCompanySaleDetail = await dbAdapter.localCompanySaleDetailAdapter.getById(payment.localCompanySaleDetail);
        if (!localCompanySaleDetail) throw new Error('Associated Local Company Sale Detail does not exist');

        // Permanently delete payment
        await dbAdapter.localCompanySaleDetailPaymentAdapter.removePermanently(id, { session: transaction.session });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    } finally {
        await transaction.end();
    }
};

module.exports = {
    createPayment,
    getPaymentsByLocalCompanySaleDetail,
    updatePayment,
    removePayment
};

