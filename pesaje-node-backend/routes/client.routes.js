const express = require('express');
const { check, query } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const { getAllClientsByUserId, getAllClients, getClientById, createClient, updateClient, removeClient } = require('../controllers/client.controller');

const router = express.Router();

router.get('/', validateJWT, getAllClientsByUserId);
router.get('/all', validateJWT, getAllClients);
router.get('/:id', validateJWT, getClientById);
router.post(
    '/',
    [
        validateJWT,

        // Person Object Validations
        check('person.names', 'Names are required').notEmpty(),
        check('person.lastNames', 'Last names are required').notEmpty(),
        check('person.identification', 'Identification is required').notEmpty(),
        check('person.birthDate')
            .optional({ nullable: true }) // Allows missing or null values
            .isISO8601()
            .toDate()
            .withMessage('birthDate must be a valid ISO 8601 date string'),
        check('person.address', 'Address is required').notEmpty(),
        check('person.mobilePhone', 'Mobile phone is required').notEmpty(),
        check('person.email')
            .optional({ nullable: true }) // Allows missing or null values
            .isEmail()
            .withMessage('Invalid email format'),
        check('person.emergencyContactName')
            .optional({ nullable: true }) // Allows missing or null values
            .notEmpty()
            .withMessage('Emergency contact name cannot be empty'),
        check('person.emergencyContactPhone')
            .optional({ nullable: true }) // Allows missing or null values
            .notEmpty()
            .withMessage('Emergency contact phone cannot be empty'),

        // Optional Fields Validation
        check('person.photo').optional().isString(),
        check('person.phone').optional().isString(),
        check('person.mobilePhone2').optional().isString(),

        // BuyersItBelongs Validation
        check('buyersItBelongs')
            .isArray({ min: 1 }).withMessage('buyersItBelongs must be an array with at least one user')
            .custom((values) => {
                if (!values.every(val => /^[0-9a-fA-F]{24}$/.test(val))) {
                    throw new Error('Each buyersItBelongs item must be a valid MongoDB ObjectId');
                }
                return true;
            }),

        validateFields
    ],
    createClient
);

router.put(
    '/:id',
    [
        validateJWT,

        // Person Object Validations (Optional in PUT)
        check('person.names').optional().notEmpty().withMessage('Names cannot be empty'),
        check('person.lastNames').optional().notEmpty().withMessage('Last names cannot be empty'),
        check('person.identification').optional().notEmpty().withMessage('Identification cannot be empty'),
        check('person.birthDate')
            .optional({ nullable: true }) // Allows missing or null values
            .isISO8601()
            .toDate()
            .withMessage('birthDate must be a valid ISO 8601 date string'),
        check('person.address').optional().notEmpty().withMessage('Address cannot be empty'),
        check('person.mobilePhone').optional().notEmpty().withMessage('Mobile phone cannot be empty'),
        check('person.email')
            .optional({ nullable: true }) // Allows missing or null values
            .isEmail()
            .withMessage('Invalid email format'),
        check('person.emergencyContactName')
            .optional({ nullable: true }) // Allows missing or null values
            .notEmpty()
            .withMessage('Emergency contact name cannot be empty'),
        check('person.emergencyContactPhone')
            .optional({ nullable: true }) // Allows missing or null values
            .notEmpty()
            .withMessage('Emergency contact phone cannot be empty'),

        // Optional Fields Validation
        check('person.photo').optional().isString(),
        check('person.phone').optional().isString(),
        check('person.mobilePhone2').optional().isString(),

        // BuyersItBelongs Validation
        check('buyersItBelongs')
            .optional()
            .isArray().withMessage('buyersItBelongs must be an array')
            .custom((values) => {
                if (!values.every(val => /^[0-9a-fA-F]{24}$/.test(val))) {
                    throw new Error('Each buyersItBelongs item must be a valid MongoDB ObjectId');
                }
                return true;
            }),

        // Prevent Updating `createdBy`
        check('createdBy').not().exists().withMessage('createdBy cannot be updated'),

        validateFields
    ],
    updateClient
);

router.delete('/:id', validateJWT, removeClient);

module.exports = router;
