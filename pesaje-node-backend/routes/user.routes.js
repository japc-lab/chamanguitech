const { Router } = require('express');
const { check, query, param } = require('express-validator');
const router = Router();

const { createUser, getUsers, getUserById, updateUser, deleteUser, updateUserPassword, uploadUserPhoto } = require('../controllers/user.controller');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');
const uploadCloudinary = require('../middlewares/upload-cloudinary');


router.post(
    '/',
    [
        validateJWT,
        // User fields validation
        check('username', 'Username is required').not().isEmpty(),
        check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
        check('roles', 'Roles must be an array and contain at least one role').isArray({ min: 1 }),

        // Person fields validation
        check('person.names', 'Person names are required').not().isEmpty(),
        check('person.lastNames', 'Person last names are required').not().isEmpty(),
        check('person.identification', 'Identification is required').not().isEmpty(),
        check('person.birthDate')
            .optional({ nullable: true }) // Allows missing or null values
            .isISO8601()
            .toDate()
            .withMessage('birthDate must be a valid ISO 8601 date string'),
        check('person.address', 'Address is required').not().isEmpty(),
        check('person.mobilePhone', 'Mobile phone is required').not().isEmpty(),
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

        validateFields,
    ],
    createUser
);

const validRoles = ["Admin", "Secretaria", "Comprador"];
router.get('/',
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
        query('role')
            .optional()
            .custom(value => {
                if (!validRoles.includes(value)) {
                    throw new Error(`Invalid role. Allowed roles: ${validRoles.join(', ')}`);
                }
                return true;
            }),
        validateFields,
    ],
    getUsers);

router.get('/:id', validateJWT, getUserById);

router.put(
    '/:id',
    [
        validateJWT,
        param('id').isMongoId().withMessage('Invalid User ID format'),
        // User update validation (optional fields)
        check('username', 'Username cannot be empty').optional().not().isEmpty(),
        check('password', 'Password must be at least 6 characters long').optional().isLength({ min: 6 }),
        check('roles', 'Roles must be an array').optional().isArray(),

        // Person update validation (optional but required if included)
        check('person.names', 'Person names cannot be empty').optional().not().isEmpty(),
        check('person.lastNames', 'Person last names cannot be empty').optional().not().isEmpty(),
        check('person.identification', 'Identification cannot be empty').optional().not().isEmpty(),
        check('person.birthDate')
            .optional({ nullable: true }) // Allows missing or null values
            .isISO8601()
            .toDate()
            .withMessage('birthDate must be a valid ISO 8601 date string'),
        check('person.address', 'Address cannot be empty').optional().not().isEmpty(),
        check('person.mobilePhone', 'Mobile phone cannot be empty').not().isEmpty(),
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

        validateFields,
    ],
    updateUser
);

router.put(
    '/:id/password',
    [
        validateJWT,
        param('id').isMongoId().withMessage('Invalid User ID'),
        check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        validateFields
    ],
    updateUserPassword
);

router.delete(
    '/:id',
    [
        param('id').isMongoId().withMessage('Invalid User ID format'),
        validateFields,
        validateJWT
    ],
    deleteUser
);

router.put(
    '/:id/photo',
    [
        validateJWT,
        param('id').isMongoId().withMessage('Invalid user ID'),
        validateFields,
        uploadCloudinary.upload.single('photo'),
        uploadCloudinary.uploadToCloudinary
    ],
    uploadUserPhoto
);

module.exports = router;