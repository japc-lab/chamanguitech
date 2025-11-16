const { Router } = require('express');
const { check, body } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const {
    createCompanySale, getCompanySaleById, getCompanySaleBySaleId, updateCompanySale,
} = require('../controllers/company-sale.controller');
const SaleStyleEnum = require('../enums/sale-style.enum');
const CompanySaleStatusEnum = require('../enums/company-sale-status.enum');

const router = Router();

router.post(
    '/',
    [
        validateJWT,
        // Allow minimal payload when status is DRAFT; otherwise enforce required fields
        // Default to DRAFT when no status provided
        (req, _res, next) => {
            if (!req.body.status) req.body.status = 'DRAFT';
            next();
        },
        check('status').optional().isIn(Object.values(CompanySaleStatusEnum)).withMessage('Invalid status'),

        check('purchase', 'Purchase ID is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isMongoId(),
        check('weightSheetNumber').optional().notEmpty().withMessage('Weight sheet number cannot be empty'),
        check('batch', 'Batch is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .notEmpty(),
        check('provider', 'Provider is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .notEmpty(),
        check('receptionDate', 'Reception date is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isISO8601(),
        check('settleDate', 'Settle date is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isISO8601(),
        check('predominantSize', 'Predominant size is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .notEmpty(),
        check('wholeReceivedPounds', 'Whole received pounds is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('trashPounds', 'Trash pounds is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('netReceivedPounds', 'Net received pounds is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('processedPounds', 'Processed pounds is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('performance', 'Performance is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('poundsGrandTotal', 'Pounds grand total is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('grandTotal', 'Price grand total is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('percentageTotal', 'Percentage total is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),

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

        check('summaryPoundsReceived', 'Summary pounds received is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('summaryPerformancePercentage', 'Summary performance percentage is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('summaryRetentionPercentage', 'Summary retention percentage is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('summaryAdditionalPenalty', 'Summary additional penalty is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),

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
        check('batch', 'Batch is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .notEmpty(),
        check('provider', 'Provider is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .notEmpty(),
        check('receptionDate', 'Reception date is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isISO8601(),
        check('settleDate', 'Settle date is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isISO8601(),
        check('predominantSize', 'Predominant size is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .notEmpty(),
        check('wholeReceivedPounds', 'Whole received pounds is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('trashPounds', 'Trash pounds is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('netReceivedPounds', 'Net received pounds is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('processedPounds', 'Processed pounds is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('performance', 'Performance is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('poundsGrandTotal', 'Pounds grand total is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('grandTotal', 'Grand total is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('percentageTotal', 'Percentage total is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),

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

        check('summaryPoundsReceived', 'Summary pounds received is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('summaryPerformancePercentage', 'Summary performance percentage is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('summaryRetentionPercentage', 'Summary retention percentage is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('summaryAdditionalPenalty', 'Summary additional penalty is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isNumeric(),
        check('status')
            .optional()
            .isIn(Object.values(CompanySaleStatusEnum))
            .withMessage('Status must be one of: ' + Object.values(CompanySaleStatusEnum).join(', ')),
        validateFields,
    ],
    updateCompanySale
);

module.exports = router;
