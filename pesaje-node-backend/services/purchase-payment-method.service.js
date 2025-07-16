const dbAdapter = require('../adapters');
const PurchaseStatusEnum = require('../enums/purchase-status.enum');

const normalize = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const determineStatus = (totalPaid, totalAgreedToPay) => {
    if (totalPaid === 0) return PurchaseStatusEnum.DRAFT;
    if (totalPaid >= totalAgreedToPay) return PurchaseStatusEnum.COMPLETED;
    return PurchaseStatusEnum.IN_PROGRESS;
};

const createPaymentMethod = async (data) => {
    const transaction = await dbAdapter.purchasePaymentMethodAdapter.startTransaction();
    try {
        const purchase = await dbAdapter.purchaseAdapter.getById(data.purchase);
        if (!purchase) throw new Error('Purchase does not exist');

        const paymentMethod = await dbAdapter.paymentMethodAdapter.getById(data.paymentMethod);
        if (!paymentMethod) throw new Error('Payment Method does not exist');

        const existingPayments = await dbAdapter.purchasePaymentMethodAdapter.getAll({ purchase: data.purchase });
        const totalPaid = normalize(existingPayments.reduce((sum, pm) => sum + Number(pm.amount), 0) + Number(data.amount));

        if (totalPaid > purchase.totalAgreedToPay) {
            throw new Error(`Total payments cannot exceed the total agreed amount of ${purchase.totalAgreedToPay}`);
        }

        const newPayment = await dbAdapter.purchasePaymentMethodAdapter.create(data, { session: transaction.session });

        const newStatus = determineStatus(totalPaid, purchase.totalAgreedToPay);
        if (purchase.status !== newStatus) {
            await dbAdapter.purchaseAdapter.update(purchase.id, { status: newStatus }, { session: transaction.session });
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
    const transaction = await dbAdapter.purchasePaymentMethodAdapter.startTransaction();
    try {
        const payment = await dbAdapter.purchasePaymentMethodAdapter.getById(id);
        if (!payment) throw new Error('Payment method not found');

        const purchase = await dbAdapter.purchaseAdapter.getById(payment.purchase);
        if (!purchase) throw new Error('Associated purchase does not exist');

        if (data.paymentMethod) {
            const paymentMethod = await dbAdapter.paymentMethodAdapter.getById(data.paymentMethod);
            if (!paymentMethod) throw new Error('New payment method does not exist');
        }

        const existingPayments = await dbAdapter.purchasePaymentMethodAdapter.getAll({
            purchase: payment.purchase,
            _id: { $ne: id }
        });

        const totalPaid = normalize(existingPayments.reduce((sum, pm) => sum + Number(pm.amount), 0) + (data.amount ? Number(data.amount) : Number(payment.amount)));

        if (totalPaid > purchase.totalAgreedToPay) {
            throw new Error(`Total payments cannot exceed the total agreed amount of ${purchase.totalAgreedToPay}`);
        }

        await dbAdapter.purchasePaymentMethodAdapter.update(id, data, { session: transaction.session });

        const newStatus = determineStatus(totalPaid, purchase.totalAgreedToPay);
        if (purchase.status !== newStatus) {
            await dbAdapter.purchaseAdapter.update(purchase.id, { status: newStatus }, { session: transaction.session });
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

const getPaymentsByPurchase = async (purchaseId) => {
    const query = {
        ...(purchaseId && { purchase: purchaseId }),
        deletedAt: null
    };
    return await dbAdapter.purchasePaymentMethodAdapter.getAllWithRelations(query, ['paymentMethod']);
};

const removePaymentMethod = async (id) => {
    const transaction = await dbAdapter.purchasePaymentMethodAdapter.startTransaction();
    try {
        const payment = await dbAdapter.purchasePaymentMethodAdapter.getById(id);
        if (!payment) throw new Error('Payment method not found');

        const purchase = await dbAdapter.purchaseAdapter.getById(payment.purchase);
        if (!purchase) throw new Error('Associated purchase does not exist');

        // ❌ Permanently delete payment method
        await dbAdapter.purchasePaymentMethodAdapter.removePermanently(id);

        // ✅ Get remaining active payments
        const remainingPayments = await dbAdapter.purchasePaymentMethodAdapter.getAll({
            purchase: payment.purchase,
            deletedAt: null
        });

        const totalPaid = normalize(remainingPayments.reduce((sum, pm) => sum + Number(pm.amount), 0));
        const newStatus = determineStatus(totalPaid, purchase.totalAgreedToPay);

        if (purchase.status !== newStatus) {
            await dbAdapter.purchaseAdapter.update(purchase.id, { status: newStatus }, { session: transaction.session });
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
    getPaymentsByPurchase,
    updatePaymentMethod,
    removePaymentMethod
};
