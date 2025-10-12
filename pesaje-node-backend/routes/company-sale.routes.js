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
        check('weightSheetNumber').optional().notEmpty().withMessage('Weight sheet number cannot be empty'),
        check('batch', 'Batch is required').notEmpty(),
        check('provider', 'Provider is required').notEmpty(),
        check('receptionDate', 'Reception date is required').isISO8601(),
        check('settleDate', 'Settle date is required').isISO8601(),
        check('predominantSize', 'Predominant size is required').notEmpty(),
        check('wholeReceivedPounds', 'Whole received pounds is required').isNumeric(),
        check('trashPounds', 'Trash pounds is required').isNumeric(),
        check('netReceivedPounds', 'Net received pounds is required').isNumeric(),
        check('processedPounds', 'Processed pounds is required').isNumeric(),
        check('performance', 'Performance is required').isNumeric(),
        check('poundsGrandTotal', 'Pounds grand total is required').isNumeric(),
        check('grandTotal', 'Price grand total is required').isNumeric(),
        check('percentageTotal', 'Percentage total is required').isNumeric(),

        // WholeDetail validation (optional)
        check('wholeDetail').optional().isObject().withMessage('WholeDetail must be an object'),
        check('wholeDetail.items').optional().isArray().withMessage('WholeDetail items must be an array'),
        check('wholeDetail.items.*.style')
            .optional()
            .isIn(Object.values(SaleStyleEnum))
            .withMessage(`Style must be one of: ${Object.values(SaleStyleEnum).join(', ')}`),
        check('wholeDetail.items.*.class').optional().notEmpty().withMessage('Class is required'),
        check('wholeDetail.items.*.size').optional().notEmpty().withMessage('Size is required'),
        check('wholeDetail.items.*.pounds').optional().isNumeric().withMessage('Pounds must be a number'),
        check('wholeDetail.items.*.price').optional().isNumeric().withMessage('Price must be a number'),
        check('wholeDetail.items.*.total').optional().isNumeric().withMessage('Total must be a number'),
        check('wholeDetail.items.*.percentage').optional().isNumeric().withMessage('Percentage must be a number'),

        // TailDetail validation (optional)
        check('tailDetail').optional().isObject().withMessage('TailDetail must be an object'),
        check('tailDetail.items').optional().isArray().withMessage('TailDetail items must be an array'),
        check('tailDetail.items.*.style')
            .optional()
            .isIn(Object.values(SaleStyleEnum))
            .withMessage(`Style must be one of: ${Object.values(SaleStyleEnum).join(', ')}`),
        check('tailDetail.items.*.class').optional().notEmpty().withMessage('Class is required'),
        check('tailDetail.items.*.size').optional().notEmpty().withMessage('Size is required'),
        check('tailDetail.items.*.pounds').optional().isNumeric().withMessage('Pounds must be a number'),
        check('tailDetail.items.*.price').optional().isNumeric().withMessage('Price must be a number'),
        check('tailDetail.items.*.total').optional().isNumeric().withMessage('Total must be a number'),
        check('tailDetail.items.*.percentage').optional().isNumeric().withMessage('Percentage must be a number'),

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
        check('weightSheetNumber').optional().notEmpty().withMessage('Weight sheet number cannot be empty'),
        check('batch', 'Batch is required').notEmpty(),
        check('provider', 'Provider is required').notEmpty(),
        check('receptionDate', 'Reception date is required').isISO8601(),
        check('settleDate', 'Settle date is required').isISO8601(),
        check('predominantSize', 'Predominant size is required').notEmpty(),
        check('wholeReceivedPounds', 'Whole received pounds is required').isNumeric(),
        check('trashPounds', 'Trash pounds is required').isNumeric(),
        check('netReceivedPounds', 'Net received pounds is required').isNumeric(),
        check('processedPounds', 'Processed pounds is required').isNumeric(),
        check('performance', 'Performance is required').isNumeric(),
        check('poundsGrandTotal', 'Pounds grand total is required').isNumeric(),
        check('grandTotal', 'Grand total is required').isNumeric(),
        check('percentageTotal', 'Percentage total is required').isNumeric(),

        // WholeDetail validation (optional)
        check('wholeDetail').optional().isObject().withMessage('WholeDetail must be an object'),
        check('wholeDetail.items').optional().isArray().withMessage('WholeDetail items must be an array'),
        check('wholeDetail.items.*.style')
            .optional()
            .isIn(Object.values(SaleStyleEnum))
            .withMessage(`Style must be one of: ${Object.values(SaleStyleEnum).join(', ')}`),
        check('wholeDetail.items.*.class').optional().notEmpty().withMessage('Class is required'),
        check('wholeDetail.items.*.size').optional().notEmpty().withMessage('Size is required'),
        check('wholeDetail.items.*.pounds').optional().isNumeric().withMessage('Pounds must be a number'),
        check('wholeDetail.items.*.price').optional().isNumeric().withMessage('Price must be a number'),
        check('wholeDetail.items.*.referencePrice').optional().isNumeric().withMessage('Reference price must be a number'),
        check('wholeDetail.items.*.total').optional().isNumeric().withMessage('Total must be a number'),
        check('wholeDetail.items.*.percentage').optional().isNumeric().withMessage('Percentage must be a number'),

        // TailDetail validation (optional)
        check('tailDetail').optional().isObject().withMessage('TailDetail must be an object'),
        check('tailDetail.items').optional().isArray().withMessage('TailDetail items must be an array'),
        check('tailDetail.items.*.style')
            .optional()
            .isIn(Object.values(SaleStyleEnum))
            .withMessage(`Style must be one of: ${Object.values(SaleStyleEnum).join(', ')}`),
        check('tailDetail.items.*.class').optional().notEmpty().withMessage('Class is required'),
        check('tailDetail.items.*.size').optional().notEmpty().withMessage('Size is required'),
        check('tailDetail.items.*.pounds').optional().isNumeric().withMessage('Pounds must be a number'),
        check('tailDetail.items.*.price').optional().isNumeric().withMessage('Price must be a number'),
        check('tailDetail.items.*.referencePrice').optional().isNumeric().withMessage('Reference price must be a number'),
        check('tailDetail.items.*.total').optional().isNumeric().withMessage('Total must be a number'),
        check('tailDetail.items.*.percentage').optional().isNumeric().withMessage('Percentage must be a number'),

        validateFields
    ],
    updateCompanySale
);

module.exports = router;
