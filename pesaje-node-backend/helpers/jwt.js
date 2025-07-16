const jwt = require('jsonwebtoken');

const generateJWT = ({ id, username, email }, expiresIn) => {

    return new Promise((resolver, reject) => {

        const payload = {};
        if (id != null) payload.id = id;
        if (username != null) payload.username = username;
        if (email != null) payload.email = email;

        jwt.sign(payload, process.env.SECRET_JWT_SEED, {
            expiresIn: expiresIn
        }, (err, token) => {
            if (err) {
                console.log(err);
                reject('Token could not be generated');
            }

            resolver(token);
        });
    })
}

module.exports = {
    generateJWT
}