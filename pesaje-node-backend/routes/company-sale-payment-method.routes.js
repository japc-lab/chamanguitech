const { Router } = require('express');
const { check, query } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const {
    createCompanySalePaymentMethod,
    getCompanySalePaymentsBySaleId,
    updateCompanySalePaymentMethod,
    deleteCompanySalePaymentMethod
} = require('../controllers/company-sale-payment-method.controller');

const router = Router();

// 🔹 Get all payments for a specific CompanySale
router.get(
    '/',
    [
        validateJWT,
        query('companySaleId', 'Invalid company sale ID')
            .optional()
            .isMongoId(),
        validateFields
    ],
    getCompanySalePaymentsBySaleId
);

// 🔹 Create a new payment method entry
router.post(
    '/',
    [
        validateJWT,
        check('companySale', 'Company Sale ID is required').isMongoId(),
        check('paymentMethod', 'Payment Method ID is required').isMongoId(),
        check('amount', 'Amount must be a positive number').isFloat({ min: 0 }),
        check('paymentDate', 'Payment date is required and must be a valid date').isISO8601(),
        validateFields
    ],
    createCompanySalePaymentMethod
);

// 🔹 Update a payment method entry
router.put(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid payment method ID').isMongoId(),
        check('paymentMethod', 'Payment Method ID must be a valid MongoDB ObjectId')
            .optional()
            .isMongoId(),
        check('amount', 'Amount must be a positive number')
            .optional()
            .isFloat({ min: 0 }),
        check('paymentDate', 'Payment date must be a valid ISO 8601 date')
            .optional()
            .isISO8601(),
        validateFields
    ],
    updateCompanySalePaymentMethod
);

// 🔹 Soft delete a payment method entry
router.delete(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid payment method ID').isMongoId(),
        validateFields
    ],
    deleteCompanySalePaymentMethod
);

module.exports = router;
