const bcrypt = require('bcryptjs');

const dbAdapter = require('../adapters');

const create = async (data) => {
    if (!data.person) {
        throw new Error('Person data is required');
    }

    // Check if the username already exists
    const existingUser = await dbAdapter.userAdapter.getAll({ username: data.username });
    if (existingUser.length > 0) {
        throw new Error('Username is already taken');
    }

    // Create the Person entry
    const person = await dbAdapter.personAdapter.create(data.person);

    // Hash the password
    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(data.password, salt);

    // Create User
    return await dbAdapter.userAdapter.create({
        username: data.username,
        password: hashedPassword,
        roles: data.roles,
        person: person.id // Use `.id` for cross-DB compatibility
    });
};

const getAll = async (includeDeleted = false, role = null) => {
    const query = includeDeleted ? {} : { deletedAt: null };

    let roleIds = [];

    if (role) {
        // 🔹 Handle multiple roles (comma-separated)
        const rolesArray = role.split(',').map(r => r.trim());

        // 🔹 Fetch role ObjectIds based on name
        const rolesList = await dbAdapter.roleAdapter.getAll({ name: { $in: rolesArray } });

        if (!rolesList.length) {
            throw new Error(`Invalid role(s): ${role}. Allowed roles: Admin, Secretaria, Comprador`);
        }

        roleIds = rolesList.map(roleObj => roleObj.id); // Extract ObjectIds
    }

    // Apply role filtering if valid roleIds exist
    if (roleIds.length) {
        query.roles = { $in: roleIds }; // Allow users with any of the selected roles
    }

    let users;

    // Ensure population works for MongoDB (not needed in relational DBs)
    if (process.env.DB_TYPE === 'mongo') {
        users = await dbAdapter.userAdapter.getAllWithRelations(query, ['person', 'roles']);
    } else {
        // Fetch all users from the adapter (for relational databases)
        users = await dbAdapter.userAdapter.getAll(query);
    }

    // Exclude password field from all users
    return users.map(({ password, ...user }) => user);
};



const getById = async (id) => {
    let user = await dbAdapter.userAdapter.getById(id);

    if (!user) {
        throw new Error('User not found');
    }

    // Ensure population for MongoDB (skip for SQL databases)
    if (process.env.DB_TYPE === 'mongo') {
        user = await dbAdapter.userAdapter.getByIdWithRelations(id, ['person', 'roles']);
    }

    // Exclude password field
    const { password, ...safeUser } = user;
    return safeUser;
};

const update = async (id, data) => {
    const user = await dbAdapter.userAdapter.getById(id);
    if (!user) {
        throw new Error('User not found');
    }

    if (!('deletedAt' in data)) {
        data.deletedAt = null;
    }

    // 👤 Update Person details if present
    if (data.person) {
        await dbAdapter.personAdapter.update(user.person, data.person);
        delete data.person;
    }

    // 🔒 Handle password update if needed
    if (data.password) {
        const salt = bcrypt.genSaltSync();
        data.password = bcrypt.hashSync(data.password, salt);
    }

    // ✅ Update user record
    await dbAdapter.userAdapter.update(id, data);

    // 🔁 Return user with populated person
    const updatedUser = await dbAdapter.userAdapter.getByIdWithRelations(id, ['person']);

    // Exclude password field
    const { password, ...safeUser } = updatedUser;
    return safeUser;
};

const updatePassword = async (id, newPassword) => {
    const user = await dbAdapter.userAdapter.getById(id);
    if (!user) throw new Error('User not found');

    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    return await dbAdapter.userAdapter.update(id, { password: hashedPassword });
};

const remove = async (id) => {
    let user = await dbAdapter.userAdapter.getById(id);
    if (!user) {
        throw new Error('User not found');
    }

    // Soft delete user
    return await dbAdapter.userAdapter.update(id, { deletedAt: new Date() });
};

const uploadPhoto = async (userId, fileOrUrl) => {
    const user = await dbAdapter.userAdapter.getById(userId);
    if (!user) throw new Error('User not found');

    const personId = user.person;

    // Support both local file and cloudinary URL
    let photoPath;
    if (typeof fileOrUrl === 'string') {
        // Cloudinary URL
        photoPath = fileOrUrl;
    } else if (fileOrUrl && fileOrUrl.filename) {
        // Local file (legacy)
        const path = require('path');
        const ext = path.extname(fileOrUrl.originalname);
        const filename = `${userId}${ext}`;
        photoPath = `/people/${filename}`;
    } else {
        throw new Error('Photo file is required');
    }

    // Update the person document with photo path
    await dbAdapter.personAdapter.update(personId, { photo: photoPath });

    return photoPath;
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    updatePassword,
    uploadPhoto,
};