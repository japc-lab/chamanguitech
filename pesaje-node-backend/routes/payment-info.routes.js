

const { Router } = require('express');
const { check, query, param } = require('express-validator');
const router = Router();

const { createPaymentInfo, getPaymentInfosByPerson, getPaymentInfoById, updatePaymentInfo, deletePaymentInfo } = require('../controllers/payment-info.controller');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');


router.post(
    '/',
    [
        check('personId')
            .not().isEmpty().withMessage('Person ID is required') // Check if missing
            .bail() // Stop validation chain if the previous check fails
            .isMongoId().withMessage('Person ID must be a valid MongoDB ObjectId'), // Check format
        check('bankName', 'Bank name is required').not().isEmpty(),
        check('accountName', 'Account name is required').not().isEmpty(),
        check('accountNumber', 'Account number is required').not().isEmpty(),
        check('identification', 'Identification is required').not().isEmpty(),
        check('mobilePhone', 'Mobile phone is required').not().isEmpty(),
        check('email', 'Valid email is required').isEmail(),
        validateFields,
        validateJWT
    ],
    createPaymentInfo
);

router.get(
    '/',
    [
        query('personId')
            .isMongoId()
            .withMessage('Invalid person ID format'), // Ensure personId is a valid ObjectId
        query('includeDeleted')
            .optional()
            .custom(value => {
                if (value !== 'true' && value !== 'false') {
                    throw new Error('includeDeleted must be either true or false');
                }
                return true;
            }),
        validateFields, // Ensure this is included to process validation
        validateJWT
    ],
    getPaymentInfosByPerson
);
router.get('/:id', validateJWT, getPaymentInfoById);
router.put(
    '/:id',
    [
        param('id').isMongoId().withMessage('Invalid PaymentInfo ID format'),
        check('bankName', 'Bank name cannot be empty').optional().not().isEmpty(),
        check('accountName', 'Account name cannot be empty').optional().not().isEmpty(),
        check('accountNumber', 'Account number cannot be empty').optional().not().isEmpty(),
        check('identification', 'Identification cannot be empty').optional().not().isEmpty(),
        check('mobilePhone', 'Mobile phone cannot be empty').optional().not().isEmpty(),
        check('email', 'Valid email is required').optional().isEmail(),
        validateFields,
        validateJWT,
    ],
    updatePaymentInfo
);
router.delete(
    '/:id',
    [
        param('id').isMongoId().withMessage('Invalid PaymentInfo ID format'),
        validateFields,
        validateJWT
    ],
    deletePaymentInfo
);

module.exports = router;