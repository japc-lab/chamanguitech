/*
    Rutas de Usuarios / Auth
    host * /api/auth
*/

const { Router } = require('express');
const { check } = require('express-validator');
const router = Router();

const { login, refreshAuthToken, getUserByToken } = require('../controllers/auth.controller');
const { validateFields } = require('../middlewares/validate-fields');
const { validateJWT } = require('../middlewares/validate-jwt');

// router.post(
//     '/new',
//     [// middlewares
//         check('name', 'El nombre es obligatorio').not().isEmpty(),
//         check('email', 'El email es obligatorio').isEmail(),
//         check('password', 'El password debe de ser de 6 caracteres').isLength({ min: 6 }),
//         validarCampos
//     ],
//     crearUsuario);

router.post(
    '/login',
    [
        check('username', 'User name is required').not().isEmpty(),
        check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
        validateFields
    ],
    login);

router.post('/renew',
    [
        check('refreshToken', 'Refresh token is required').not().isEmpty(),
        validateFields
    ],
    refreshAuthToken);
router.get('/me', validateJWT, getUserByToken);

module.exports = router;