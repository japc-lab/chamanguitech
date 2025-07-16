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
const LogisticsTypeEnum = require('../enums/logistics-type.enum');

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
    check('purchase', 'Purchase ID is required').isMongoId(),
    check('logisticsDate', 'Valid logisticsDate is required').isISO8601().toDate(),
    check('grandTotal', 'grandTotal must be a positive number').isFloat({ min: 0 }),
    check('type')
        .notEmpty()
        .withMessage('Type is required')
        .isIn(Object.values(LogisticsTypeEnum))
        .withMessage(`type must be one of: ${Object.values(LogisticsTypeEnum).join(', ')}`),
    body('items').isArray({ min: 1 }).withMessage('Items must be an array with at least one element'),
    body('items.*.logisticsCategory', 'Each item must have a valid logisticsCategory ID').isMongoId(),
    body('items.*.unit', 'Each item unit must be a positive number').isFloat({ min: 0 }),
    body('items.*.cost', 'Each item cost must be a positive number').isFloat({ min: 0 }),
    body('items.*.total', 'Each item total must be a positive number').isFloat({ min: 0 }),
    validateFields
], createLogistics);

router.put(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid logistics ID').isMongoId(),
        check('logisticsDate', 'Logistics date must be a valid ISO date').optional().isISO8601(),
        check('grandTotal', 'grandTotal must be a number >= 0').optional().isFloat({ min: 0 }),
        body('items').optional().isArray({ min: 1 }),
        body('items.*.logisticsCategory', 'Each item must have a valid logisticsType ID').isMongoId(),
        body('items.*.unit', 'Each item must have a numeric unit >= 0').isFloat({ min: 0 }),
        body('items.*.cost', 'Each item must have a numeric cost >= 0').isFloat({ min: 0 }),
        body('items.*.total', 'Each item must have a numeric total >= 0').isFloat({ min: 0 }),
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
