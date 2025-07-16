const { response } = require('express');
const { validationResult } = require('express-validator');

const { create, getAll, getById, remove, updatePassword, update, uploadPhoto } = require('../services/user.service');


const createUser = async (req, res = response) => {
    try {
        const user = await create(req.body);
        res.status(201).json({
            ok: true,
            message: "User created successfully",
            data: user
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message
        });
    }
};

const getUsers = async (req, res = response) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const role = req.query.role || null; // Extract role from query params

        const users = await getAll(includeDeleted, role); // Pass role filter

        res.status(200).json({
            ok: true,
            users,
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: error.message
        });
    }
};


const getUserById = async (req, res = response) => {
    try {
        const user = await getById(req.params.id);
        if (!user) return res.status(404).json({
            ok: false,
            message: 'User not found'
        });
        res.status(200).json({
            ok: true,
            user,
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: error.message
        });
    }
};

const updateUser = async (req, res = response) => {
    try {
        const updatedUser = await update(req.params.id, req.body);
        res.status(200).json({
            ok: true,
            updatedUser,
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error.message
        });
    }
};

const updateUserPassword = async (req, res = response) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ ok: false, message: 'Password must be at least 6 characters long' });
        }

        await updatePassword(id, password);
        res.json({ ok: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

const deleteUser = async (req, res = response) => {
    try {
        const { id } = req.params;

        await remove(id); // Call service function

        res.status(200).json({
            ok: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(error.status || 500).json({
            ok: false,
            message: error.message
        });
    }
};

const uploadUserPhoto = async (req, res = response) => {
    try {
        // Use Cloudinary URL if available, otherwise pass file
        const photoPath = await uploadPhoto(req.params.id, req.cloudinaryUrl || req.file);
        res.json({ ok: true, photo: photoPath });
    } catch (error) {
        res.status(400).json({ ok: false, message: error.message });
    }
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateUserPassword,
    uploadUserPhoto
}