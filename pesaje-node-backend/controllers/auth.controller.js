const { response } = require('express');
const { loginUser, revalidateAuthToken, getUserById } = require('../services/auth.service');


// const crearUsuario = async (req, res = response) => {

//     const { email, password } = req.body;

//     try {

//         let usuario = await Usuario.findOne({ email });

//         if (usuario) {
//             return res.status(400).json({
//                 ok: false,
//                 msg: 'Un usuario existe con ese correo'
//             });
//         }

//         usuario = new Usuario(req.body);

//         // Encriptar contraseña
//         const salt = bcrypt.genSaltSync();
//         usuario.password = bcrypt.hashSync(password, salt);

//         await usuario.save();

//         // Generar nuestro JWT
//         const token = await generateJWT(usuario.id, usuario.name);

//         res.status(201).json({
//             ok: true,
//             uid: usuario.id,
//             name: usuario.name,
//             token
//         });

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             ok: false,
//             msg: 'Por favor hable con el administrador'
//         });
//     }

// }

const login = async (req, res = response) => {
    try {
        const { username, password } = req.body;
        const result = await loginUser(username, password);
        // console.log(result)
        res.status(200).json({
            ok: true,
            ...result
        });
    } catch (error) {
        res.status(401).json({
            ok: false,
            error: error.message
        });
    }
}

const refreshAuthToken = async (req, res = response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ ok: false, message: 'Refresh token required' });
        }

        const result = await revalidateAuthToken(refreshToken);
        res.status(200).json({
            ok: true,
            ...result
        });
    } catch (error) {
        res.status(401).json({
            ok: false,
            error: error.message
        });
    }
}

const getUserByToken = async (req, res = response) => {
    try {
        const result = await getUserById(req.id);

        const user = {
            ...result.user,
            permissions: result.permissions,
        }

        res.status(200).json({
            ok: true,
            user,
        });
    } catch (error) {
        res.status(401).json({
            ok: false,
            error: error.message
        });
    }
}

module.exports = {
    // crearUsuario,
    login,
    refreshAuthToken,
    getUserByToken,
}