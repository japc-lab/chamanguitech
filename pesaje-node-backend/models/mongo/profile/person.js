const { Schema, model } = require('mongoose');

const PersonSchema = new Schema({
    photo: {
        type: String  // e.g., URL or file path; optional
    },
    names: {
        type: String,
        required: true
    },
    lastNames: {
        type: String,
        required: true
    },
    identification: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String  // optional landline or similar
    },
    mobilePhone: {
        type: String,
        required: true
    },
    mobilePhone2: {
        type: String  // optional
    },
    email: {
        type: String,
    },
    emergencyContactName: {
        type: String,
    },
    emergencyContactPhone: {
        type: String,
    },
},
    { timestamps: true },
);


PersonSchema.method('toJSON', function () {
    const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
    object.id = _id;
    return object;
});

module.exports = model('Person', PersonSchema);