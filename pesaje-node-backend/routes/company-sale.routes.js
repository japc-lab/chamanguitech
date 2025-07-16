const { Router } = require('express');
const { check, body } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const {
    createCompanySale, getCompanySaleById, getCompanySaleBySaleId, updateCompanySale,
} = require('../controllers/company-sale.controller');
const SaleStyleEnum = require('../enums/sale-style.enum');

const router = Router();

router.post(
    '/',
    [
        validateJWT,
        check('purchase', 'Purchase ID is required').isMongoId(),
        check('saleDate', 'Sale date is required').isISO8601(),
        check('document', 'Document is required').notEmpty(),
        check('batch', 'Batch is required').notEmpty(),
        check('provider', 'Provider is required').notEmpty(),
        check('np').optional().notEmpty().withMessage('NP cannot be empty if provided'),
        check('serialNumber', 'Serial number is required').isNumeric(),
        check('receptionDateTime', 'Reception date is required').isISO8601(),
        check('settleDateTime', 'Settle date is required').isISO8601(),
        check('batchAverageGram', 'Batch average gram is required').isNumeric(),
        check('wholeReceivedPounds', 'Whole received pounds is required').isNumeric(),
        check('trashPounds', 'Trash pounds is required').isNumeric(),
        check('netReceivedPounds', 'Net received pounds is required').isNumeric(),
        check('processedPounds', 'Processed pounds is required').isNumeric(),
        check('performance', 'Performance is required').isNumeric(),
        check('poundsGrandTotal', 'Pounds grand total is required').isNumeric(),
        check('grandTotal', 'Price grand total is required').isNumeric(),
        check('percentageTotal', 'Percentage total is required').isNumeric(),

        // 🔹 Items array and subfields
        check('items', 'Items must be a non-empty array').isArray({ min: 1 }),
        check('items.*.style')
            .notEmpty()
            .withMessage('Style is required')
            .isIn(Object.values(SaleStyleEnum))
            .withMessage(`Style must be one of: ${Object.values(SaleStyleEnum).join(', ')}`),
        check('items.*.class', 'Class is required').notEmpty(),
        check('items.*.size', 'Size is required').notEmpty(),
        check('items.*.pounds', 'Pounds must be a number').isNumeric(),
        check('items.*.price', 'Price must be a number').isNumeric(),
        check('items.*.total', 'Total must be a number').isNumeric(),
        check('items.*.percentage', 'Percentage must be a number').isNumeric(),

        validateFields,
    ],
    createCompanySale
);

router.get(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid sale ID').isMongoId(),
        validateFields
    ],
    getCompanySaleById
);

router.get(
    '/by-sale/:saleId',
    [
        validateJWT,
        check('saleId', 'Invalid Sale ID').isMongoId(),
        validateFields
    ],
    getCompanySaleBySaleId
);

router.put(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid ID').isMongoId(),
        check('saleDate', 'Sale date is required').isISO8601(),
        check('document', 'Document is required').notEmpty(),
        check('batch', 'Batch is required').notEmpty(),
        check('provider', 'Provider is required').notEmpty(),
        check('serialNumber', 'Serial number is required').isNumeric(),
        check('receptionDateTime', 'Reception date is required').isISO8601(),
        check('settleDateTime', 'Settle date is required').isISO8601(),
        check('batchAverageGram', 'Batch average gram is required').isNumeric(),
        check('wholeReceivedPounds', 'Whole received pounds is required').isNumeric(),
        check('trashPounds', 'Trash pounds is required').isNumeric(),
        check('netReceivedPounds', 'Net received pounds is required').isNumeric(),
        check('processedPounds', 'Processed pounds is required').isNumeric(),
        check('performance', 'Performance is required').isNumeric(),
        check('poundsGrandTotal', 'Pounds grand total is required').isNumeric(),
        check('grandTotal', 'Grand total is required').isNumeric(),
        check('percentageTotal', 'Percentage total is required').isNumeric(),
        check('items', 'Items must be a non-empty array').isArray({ min: 1 }),
        check('items.*.style', 'Style is required').notEmpty(),
        check('items.*.class', 'Class is required').notEmpty(),
        check('items.*.size', 'Size is required').notEmpty(),
        check('items.*.pounds', 'Pounds must be a number').isNumeric(),
        check('items.*.price', 'Price must be a number').isNumeric(),
        check('items.*.referencePrice', 'Reference price must be a number').isNumeric(),
        check('items.*.total', 'Total must be a number').isNumeric(),
        check('items.*.percentage', 'Percentage must be a number').isNumeric(),
        validateFields
    ],
    updateCompanySale
);

module.exports = router;
