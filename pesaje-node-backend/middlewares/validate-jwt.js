const { response } = require('express');
const jwt = require('jsonwebtoken');

const validateJWT = (req, res = response, next) => {

    // x-token
    // const token = req.header('x-token');

    // Extract the Authorization header
    const authHeader = req.header('Authorization');

    // Check if the header is present and formatted correctly
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            ok: false,
            msg: 'Authorization header missing or malformed'
        });
    }
    // Extract the token after "Bearer "
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: 'Request without token'
        });
    }

    try {

        const { id, username } = jwt.verify(
            token,
            process.env.SECRET_JWT_SEED
        );

        req.id = id;
        req.username = username;

    } catch (error) {
        console.log(error.message)
        return res.status(401).json({
            ok: false,
            msg: 'Invalid token'
        });
    }

    next();
}

module.exports = {
    validateJWT
}