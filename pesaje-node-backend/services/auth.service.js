const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { generateJWT } = require('../helpers/jwt');
const dbAdapter = require('../adapters');


const loginUser = async (username, password) => {
    try {
        const users = await dbAdapter.userAdapter.getAllWithRelations({ username }, ['person']);
        if (!users.length) {
            throw new Error('Invalid credentials');
        }

        const user = users[0];

        // Verify the password 
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Generate JWT token (access token) - expires in 1 hour
        const authToken = await generateJWT(
            {
                id: user.id,
                username: user.username,
                email: user.person.email
            }, process.env.AUTH_TOKEN_EXPIRE_IN || '1h');

        // Generate Refresh Token - expires in 7 days
        const refreshToken = await generateJWT(
            {
                id: user.id,
            }, process.env.REFRESH_TOKEN_EXPIRE_IN || '7d');

        // Convert expiresIn to a Date object (current time + 1 hour)
        const expiresInDate = new Date(Date.now() + 60 * 60 * 1000);

        return {
            authToken,
            refreshToken,
            expiresIn: expiresInDate,
            // user: { id: user._id, name: user.username },
            // permissions: nestedOptions
        };
    } catch (error) {
        console.error('Login error:', error.message);
        throw new Error(error.message || 'Something went wrong during login');
    }
};

const revalidateAuthToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.SECRET_JWT_SEED || 'secretKey');

        // Fetch user from database
        const user = await dbAdapter.userAdapter.getByIdWithRelations(decoded.id, ['person']);
        if (!user) {
            throw new Error('User not found');
        }

        // Generate new auth token
        const newAuthToken = await generateJWT(
            {
                id: user.id,
                username: user.username,
                email: user.person.email
            }, process.env.AUTH_TOKEN_EXPIRE_IN || '1h');
        return {
            authToken: newAuthToken,
            refreshToken,
            expiresIn: new Date(Date.now() + 60 * 60 * 1000)
        };
    } catch (error) {
        console.error('Revalidate token error:', error.message);
        throw new Error(error.message || 'Invalid or expired refresh token');
    }
}

const getUserById = async (id) => {
    try {
        // Fetch user from database
        const user = await dbAdapter.userAdapter.getByIdWithRelations(id, ['person', 'roles']);
        if (!user) {
            throw new Error('User not found');
        }

        // Permissions
        const rolePermissions = await dbAdapter.rolePermissionAdapter.getAll({ role: { $in: user.roles.map(role => role.id) } });

        const optionsMap = {};

        rolePermissions.forEach((rolePerm) => {
            const optionId = rolePerm.option.toString();
            // If this option hasn't been added to the map, initialize it.
            if (!optionsMap[optionId]) {
                optionsMap[optionId] = new Set();
            }
            // Add all actions from this rolePermission.
            rolePerm.actions.forEach(action => optionsMap[optionId].add(action));
        });

        const optionsData = await dbAdapter.optionAdapter.getAll({ _id: { $in: Object.keys(optionsMap) } });

        const optionsArray = optionsData.map(opt => {
            return {
                id: opt.id,
                name: opt.name,
                parentOption: opt.parentOption,
                route: opt.route,
                icon: opt.icon,
            }
        });

        optionsArray.forEach(opt => {
            opt.actions = optionsMap[opt.id.toString()]
                ? Array.from(optionsMap[opt.id.toString()])
                : [];
        });

        // Create a lookup map with each option keyed by its _id as a string.
        const lookup = {};

        // First pass: clone each option and add a suboptions property.
        optionsArray.forEach(option => {
            // Make sure to clone and add an empty suboptions array.
            lookup[option.id.toString()] = { ...option, suboptions: [] };
        });

        // Array to hold the top-level options.
        const nestedOptions = [];

        // Second pass: nest each option based on its parentOption.
        optionsArray.forEach(option => {
            const id = option.id.toString();
            if (option.parentOption) {
                const parentId = option.parentOption.toString();
                // If the parent exists in our lookup, add this option to its suboptions.
                if (lookup[parentId]) {
                    lookup[parentId].suboptions.push(lookup[id]);
                } else {
                    // If the parent isn't found, treat this option as a top-level option.
                    nestedOptions.push(lookup[id]);
                }
            } else {
                // No parentOption means it's a top-level option.
                nestedOptions.push(lookup[id]);
            }
        });

        // console.log(JSON.stringify(nestedOptions, null, 2));

        return {
            user: {
                id: user.id,
                username: user.username,
                fullname: `${user.person.names} ${user.person.lastNames}`,
                email: user.person.email,
                roles: user.roles,
                person: {
                    names: user.person.names,
                    lastNames: user.person.lastNames,
                    photo: user.person.photo,
                }
                // person: user.person
            },
            permissions: nestedOptions,
        };
    } catch (error) {
        console.error('User by Id error:', error.message);
        throw new Error(error.message);
    }
}

module.exports = {
    loginUser,
    revalidateAuthToken,
    getUserById,
};