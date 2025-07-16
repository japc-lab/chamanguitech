const express = require('express');
const { check, query, param } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');

const {
    getAllPurchasesByParams,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    deletePurchase
} = require('../controllers/purchase.controller');

const router = express.Router();

// 🔹 Get all purchases with optional filters
router.get(
    '/by-params',
    [
        validateJWT,
        query('includeDeleted')
            .optional()
            .custom(value => {
                if (value !== 'true' && value !== 'false') {
                    throw new Error('includeDeleted must be either true or false');
                }
                return true;
            }),
        query('clientId').optional().isMongoId().withMessage('Client ID must be a valid MongoDB ObjectId'),
        query('userId').optional().isMongoId().withMessage('User ID must be a valid MongoDB ObjectId'),
        query('companyId').optional().isMongoId().withMessage('Company ID must be a valid MongoDB ObjectId'),
        query('periodId').optional().isMongoId().withMessage('Period ID must be a valid MongoDB ObjectId'),
        query('controlNumber')
            .optional()
            .isString()
            .withMessage('Control number must be a string'),
        validateFields,
    ],
    getAllPurchasesByParams
);

// 🔹 Get purchase by ID
router.get('/:id', [validateJWT, param('id').isMongoId().withMessage('Invalid purchase ID')], getPurchaseById);

// 🔹 Create a purchase
router.post(
    '/',
    [
        validateJWT,
        check('buyer', 'Buyer ID is required').isMongoId(),
        check('company', 'Company ID is required').isMongoId(),
        check('broker', 'Broker ID is required').isMongoId(),
        check('client', 'Client ID is required').isMongoId(),
        check('shrimpFarm', 'Shrimp Farm ID is required').isMongoId(),
        check('period')
            .optional()
            .isMongoId()
            .withMessage('Period must be a valid MongoDB ObjectId'),
        check('averageGrams', 'Average grams must be a positive number').isFloat({ min: 0 }),
        check('price', 'Price must be a positive number').isFloat({ min: 0 }),
        check('pounds', 'Pounds must be a positive number').isFloat({ min: 0 }),
        check('totalPounds', 'Total pounds must be a positive number').isFloat({ min: 0 }),
        check('subtotal', 'Subtotal must be a positive number').isFloat({ min: 0 }),
        check('grandTotal', 'Grand total must be a positive number').isFloat({ min: 0 }),
        check('totalAgreedToPay', 'Total agreed to pay must be a positive number').isFloat({ min: 0 }),
        check('hasInvoice', 'hasInvoice is required and must be boolean').isBoolean(),
        validateFields
    ],
    createPurchase
);

// 🔹 Update a purchase
router.put(
    '/:id',
    [
        validateJWT,
        param('id').isMongoId().withMessage('Invalid purchase ID'),
        check('averageGrams').optional().isFloat({ min: 0 }),
        check('price').optional().isFloat({ min: 0 }),
        check('pounds').optional().isFloat({ min: 0 }),
        check('totalPounds').optional().isFloat({ min: 0 }),
        check('subtotal').optional().isFloat({ min: 0 }),
        check('grandTotal').optional().isFloat({ min: 0 }),
        check('totalAgreedToPay').optional().isFloat({ min: 0 }),
        check('hasInvoice').optional().isBoolean(),
        validateFields
    ],
    updatePurchase
);

// 🔹 Soft delete a purchase
router.delete('/:id', [validateJWT, param('id').isMongoId().withMessage('Invalid purchase ID')], deletePurchase);

module.exports = router;
