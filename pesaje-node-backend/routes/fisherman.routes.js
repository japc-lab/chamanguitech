const express = require('express');
const { check, query } = require('express-validator');
const router = express.Router();

const { getAllFishermen, getFishermanById, createFisherman, updateFisherman, removeFisherman } = require('../controllers/fisherman.controller');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');

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
        validateFields,
    ],
    getAllFishermen
);

router.get('/:id', validateJWT, getFishermanById);

router.post(
    '/',
    [
        validateJWT,
        // Validate embedded person fields
        check('person.names', 'Names are required').notEmpty(),
        check('person.lastNames', 'Last names are required').notEmpty(),
        check('person.identification', 'Identification is required').notEmpty(),
        check('person.birthDate')
            .optional({ nullable: true })
            .isISO8601()
            .toDate()
            .withMessage('birthDate must be a valid ISO 8601 date string'),
        check('person.address', 'Address is required').notEmpty(),
        check('person.mobilePhone', 'Mobile phone is required').notEmpty(),
        check('person.email')
            .optional({ nullable: true })
            .custom(value => {
                if (value === '' || value === null || value === undefined) {
                    return true; // Allow empty, null, or undefined values
                }
                // If a value is provided, it must be a valid email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    throw new Error('Invalid email format');
                }
                return true;
            })
            .withMessage('Invalid email format'),
        check('person.emergencyContactName').optional(),
        check('person.emergencyContactPhone').optional(),
        validateFields,
    ],
    createFisherman
);

router.put(
    '/:id',
    [
        validateJWT,
        check('person.names', 'Names are required').optional().notEmpty(),
        check('person.lastNames', 'Last names are required').optional().notEmpty(),
        check('person.identification', 'Identification is required').optional().notEmpty(),
        check('person.birthDate')
            .optional({ nullable: true })
            .isISO8601()
            .toDate()
            .withMessage('birthDate must be a valid ISO 8601 date string'),
        check('person.address', 'Address is required').optional().notEmpty(),
        check('person.mobilePhone', 'Mobile phone is required').optional().notEmpty(),
        check('person.email')
            .optional({ nullable: true })
            .custom(value => {
                if (value === '' || value === null || value === undefined) {
                    return true; // Allow empty, null, or undefined values
                }
                // If a value is provided, it must be a valid email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    throw new Error('Invalid email format');
                }
                return true;
            })
            .withMessage('Invalid email format'),
        check('person.emergencyContactName').optional(),
        check('person.emergencyContactPhone').optional(),

        // Validate deletedAt field
        check('deletedAt')
            .optional({ nullable: true })
            .isISO8601()
            .toDate()
            .withMessage('deletedAt must be a valid ISO 8601 date string or null'),

        validateFields,
    ],
    updateFisherman
);

router.delete('/:id', validateJWT, removeFisherman);

module.exports = router; 