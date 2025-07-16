const express = require('express');
const { check, query } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const {
    getAllShrimpFarms,
    getShrimpFarmsByClientIdAndUserId,
    getShrimpFarmById,
    createShrimpFarm,
    updateShrimpFarm,
    removeShrimpFarm
} = require('../controllers/shrimp-farm.controller');
const TransportationMethodEnum = require('../enums/transportation-method.enum');

const router = express.Router();

// 🔹 Get all shrimp farms
router.get(
    '/all',
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
        validateFields
    ],
    getAllShrimpFarms
);

// 🔹 Get shrimp farms by client ID (now used only when `clientId` is provided)
router.get(
    '/',
    [
        validateJWT,
        query('clientId')
            .isMongoId()
            .withMessage('Invalid client ID format'),
        query('userId')
            .optional()
            .isMongoId()
            .withMessage('Invalid user ID format'),
        query('includeDeleted')
            .optional()
            .custom(value => {
                if (value !== 'true' && value !== 'false') {
                    throw new Error('includeDeleted must be either true or false');
                }
                return true;
            }),
        validateFields
    ],
    getShrimpFarmsByClientIdAndUserId
);

// 🔹 Get shrimp farm by ID
router.get('/:id', validateJWT, getShrimpFarmById);

// 🔹 Create a shrimp farm
router.post(
    '/',
    [
        validateJWT,
        check('identifier', 'Identifier is required').notEmpty(),
        check('numberHectares')
            .isNumeric()
            .withMessage('Number of hectares must be a numeric value')
            .isFloat({ min: 0 })
            .withMessage('Number of hectares must be at least 0'),
        check('place', 'Place is required').notEmpty(),
        check('transportationMethod')
            .notEmpty()
            .withMessage('Transportation method is required')
            .isIn(Object.values(TransportationMethodEnum))
            .withMessage(`transportationMethod must be one of: ${Object.values(TransportationMethodEnum).join(', ')}`),
        check('distanceToGate')
            .isNumeric()
            .withMessage('Distance to gate must be a numeric value')
            .isFloat({ min: 0 })
            .withMessage('Distance to gate must be at least 0'),
        check('timeFromPedernales')
            .isNumeric()
            .withMessage('Time from Pedernales must be a numeric value')
            .isFloat({ min: 0 })
            .withMessage('Time from Pedernales must be at least 0'),
        check('client', 'Client ID must be a valid MongoDB ObjectId').isMongoId(),
        check('buyerItBelongs', 'Buyer ID must be a valid MongoDB ObjectId').isMongoId(),
        validateFields
    ],
    createShrimpFarm
);

// 🔹 Update a shrimp farm
router.put(
    '/:id',
    [
        validateJWT,
        check('id', 'Invalid shrimp farm ID').isMongoId(),
        check('identifier')
            .optional()
            .notEmpty()
            .withMessage('Identifier cannot be empty'),
        check('numberHectares')
            .optional()
            .isNumeric()
            .withMessage('Number of hectares must be a numeric value')
            .isFloat({ min: 0 })
            .withMessage('Number of hectares must be at least 0'),
        check('place')
            .optional()
            .notEmpty()
            .withMessage('Place cannot be empty'),
        check('transportationMethod')
            .optional()
            .notEmpty()
            .withMessage('Transportation method cannot be empty')
            .isIn(Object.values(TransportationMethodEnum))
            .withMessage(`Transportation method must be one of: ${Object.values(TransportationMethodEnum).join(', ')}`),
        check('distanceToGate')
            .optional()
            .isNumeric()
            .withMessage('Distance to gate must be a numeric value')
            .isFloat({ min: 0 })
            .withMessage('Distance to gate must be at least 0'),
        check('timeFromPedernales')
            .optional()
            .isNumeric()
            .withMessage('Time from Pedernales must be a numeric value')
            .isFloat({ min: 0 })
            .withMessage('Time from Pedernales must be at least 0'),
        check('buyerItBelongs')
            .optional()
            .isMongoId()
            .withMessage('Buyer ID must be a valid MongoDB ObjectId'),
        validateFields,
    ],
    updateShrimpFarm
);

// 🔹 Soft delete a shrimp farm
router.delete('/:id', validateJWT, removeShrimpFarm);

module.exports = router;
