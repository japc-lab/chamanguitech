const { Router } = require('express');
const { check, query } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const {
    createLocalCompanySaleDetailPayment,
    getPaymentsByLocalCompanySaleDetailId,
    updateLocalCompanySaleDetailPayment,
    deleteLocalCompanySaleDetailPayment
} = require('../controllers/local-company-sale-detail-payment.controller');

const router = Router();

// 🔹 Get all payments for a specific local company sale detail
router.get(
    '/',
    [
        validateJWT,
        query('localCompanySaleDetailId', 'Invalid local company sale detail ID')
            .optional()
            .isMongoId(),
        validateFields
    ],
    getPaymentsByLocalCompanySaleDetailId
);

// 🔹 Create a new payment entry
router.post(
    '/',
    [
        validateJWT,
        check('localCompanySaleDetail', 'Local Company Sale Detail ID is required').isMongoId(),
        check('paymentMethod', 'Payment Method ID is required').isMongoId(),
        check('amount', 'Amount must be a positive number').isFloat({ min: 0 }),
        check('paymentDate', 'Payment date is required and must be a valid date').isISO8601(),
        check('accountName', 'Account name is required').not().isEmpty(),
        check('observation', 'Observation is optional').optional().not().isEmpty(),
        validateFields
    ],
    createLocalCompanySaleDetailPayment
);

// 🔹 Update an existing payment entry
router.put(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid payment ID').isMongoId(),
        check('paymentMethod', 'Payment Method ID must be a valid MongoDB ObjectId')
            .optional()
            .isMongoId(),
        check('amount', 'Amount must be a positive number')
            .optional()
            .isFloat({ min: 0 }),
        check('paymentDate', 'Payment date must be a valid ISO 8601 date')
            .optional()
            .isISO8601(),
        check('accountName', 'Account name is required').optional().not().isEmpty(),
        check('observation', 'Observation is optional').optional().not().isEmpty(),
        validateFields
    ],
    updateLocalCompanySaleDetailPayment
);

// 🔹 Delete a payment entry
router.delete(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid payment ID').isMongoId(),
        validateFields
    ],
    deleteLocalCompanySaleDetailPayment
);

module.exports = router;

