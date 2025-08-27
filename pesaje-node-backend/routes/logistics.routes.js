const { Router } = require('express');
const { check, body } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const {
    createLogistics,
    getLogisticsByParams,
    getLogisticsById,
    updateLogistics,
    deleteLogistics
} = require('../controllers/logistics.controller');

const router = Router();

const { query } = require('express-validator');
const { LogisticsTypeEnum, LogisticsStatusEnum } = require('../enums/logistics.enums');

router.get(
    '/by-params',
    [
        validateJWT,
        query('userId').optional().isMongoId().withMessage('Invalid user ID format'),
        query('controlNumber')
            .optional()
            .isString()
            .withMessage('Control number must be a string'),
        query('includeDeleted').optional().custom(value => {
            if (value !== 'true' && value !== 'false') {
                throw new Error('includeDeleted must be either true or false');
            }
            return true;
        }),
        validateFields
    ],
    getLogisticsByParams
);

router.get('/:id', [
    validateJWT,
    check('id', 'Invalid Logistics ID').isMongoId(),
    validateFields
], getLogisticsById);

router.post('/', [
    validateJWT,
    // Allow minimal payload when status is DRAFT; otherwise enforce required fields
    // Default to DRAFT when no status provided
    (req, _res, next) => {
        if (!req.body.status) req.body.status = 'DRAFT';
        next();
    },
    check('status').optional().isIn(Object.values(LogisticsStatusEnum)).withMessage('Invalid status'),

    check('purchase', 'Purchase ID is required')
        .if((value, { req }) => req.body.status !== 'DRAFT')
        .exists()
        .isMongoId(),
    check('logisticsDate', 'Valid logisticsDate is required')
        .if((value, { req }) => req.body.status !== 'DRAFT')
        .exists()
        .isISO8601().toDate(),
    check('grandTotal', 'grandTotal must be a positive number')
        .if((value, { req }) => req.body.status !== 'DRAFT')
        .exists()
        .isFloat({ min: 0 }),
    check('logisticsSheetNumber', 'logisticsSheetNumber is required')
        .if((value, { req }) => req.body.status !== 'DRAFT')
        .exists()
        .notEmpty(),
    check('type')
        .if((value, { req }) => req.body.status !== 'DRAFT')
        .exists()
        .withMessage('Type is required')
        .isIn(Object.values(LogisticsTypeEnum))
        .withMessage(`type must be one of: ${Object.values(LogisticsTypeEnum).join(', ')}`),
    body('items')
        .if((value, { req }) => req.body.status !== 'DRAFT')
        .isArray({ min: 1 })
        .withMessage('Items must be an array with at least one element'),
    body('items.*.financeCategory', 'Each item must have a valid financeCategory')
        .if((value, { req }) => req.body.status !== 'DRAFT'),
    body('items.*.resourceCategory', 'Each item must have a valid resourceCategory')
        .if((value, { req }) => req.body.status !== 'DRAFT'),
    body('items.*.unit', 'Each item unit must be a positive number')
        .if((value, { req }) => req.body.status !== 'DRAFT')
        .isFloat({ min: 0 }),
    body('items.*.cost', 'Each item cost must be a positive number')
        .if((value, { req }) => req.body.status !== 'DRAFT')
        .isFloat({ min: 0 }),
    body('items.*.total', 'Each item total must be a positive number')
        .if((value, { req }) => req.body.status !== 'DRAFT')
        .isFloat({ min: 0 }),
    body('payments').optional().isArray().withMessage('Payments must be an array'),
    body('payments.*.amount', 'Each payment must have a valid amount').optional().isFloat({ min: 0 }),
    body('payments.*.paymentStatus', 'Each payment must have a valid paymentStatus').optional().isIn(['NO_PAYMENT', 'PENDING', 'PAID']),
    body('payments.*.hasInvoice', 'Each payment must have a valid hasInvoice').optional().isIn(['yes', 'no', 'not-applicable']),
    validateFields
], createLogistics);

router.put(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid logistics ID').isMongoId(),
        check('logisticsDate', 'Logistics date must be a valid ISO date')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isISO8601(),
        check('grandTotal', 'grandTotal must be a number >= 0')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .isFloat({ min: 0 }),
        check('logisticsSheetNumber', 'logisticsSheetNumber is required')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .notEmpty(),
        check('type')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .exists()
            .withMessage('Type is required')
            .isIn(Object.values(LogisticsTypeEnum))
            .withMessage(`type must be one of: ${Object.values(LogisticsTypeEnum).join(', ')}`),
        body('items')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .optional()
            .isArray({ min: 1 }),
        body('items.*.financeCategory', 'Each item must have a valid financeCategory')
            .if((value, { req }) => req.body.status !== 'DRAFT'),
        body('items.*.resourceCategory', 'Each item must have a valid resourceCategory')
            .if((value, { req }) => req.body.status !== 'DRAFT'),
        body('items.*.unit', 'Each item must have a numeric unit >= 0')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .isFloat({ min: 0 }),
        body('items.*.cost', 'Each item must have a numeric cost >= 0')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .isFloat({ min: 0 }),
        body('items.*.total', 'Each item must have a numeric total >= 0')
            .if((value, { req }) => req.body.status !== 'DRAFT')
            .isFloat({ min: 0 }),
        body('payments').optional().isArray().withMessage('Payments must be an array'),
        body('payments.*.amount', 'Each payment must have a valid amount').optional().isFloat({ min: 0 }),
        body('payments.*.paymentStatus', 'Each payment must have a valid paymentStatus').optional().isIn(['NO_PAYMENT', 'PENDING', 'PAID']),
        body('payments.*.hasInvoice', 'Each payment must have a valid hasInvoice').optional().isIn(['yes', 'no', 'not-applicable']),
        check('status')
            .optional()
            .isIn(Object.values(LogisticsStatusEnum))
            .withMessage('Status must be one of: ' + Object.values(LogisticsStatusEnum).join(', ')),
        validateFields,
    ],
    updateLogistics
);


router.delete('/:id', [
    validateJWT,
    check('id', 'Invalid Logistics ID').isMongoId(),
    validateFields
], deleteLogistics);

module.exports = router;
