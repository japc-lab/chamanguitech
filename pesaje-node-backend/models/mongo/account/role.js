const { Schema, model } = require('mongoose');

const RoleSchema = Schema({

    name: {
        type: String,
        required: true,
        unique: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
},
    { timestamps: true },
);


RoleSchema.method('toJSON', function () {
    const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
    object.id = _id;
    return object;
});

module.exports = model('Role', RoleSchema);