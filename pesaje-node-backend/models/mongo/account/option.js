const { Schema, model } = require('mongoose');

const OptionSchema = Schema({

    name: {
        type: String,
        required: true
    },
    route: {
        type: String,
    },
    icon: {
        type: String,
    },
    parentOption: {
        type: Schema.Types.ObjectId,
        ref: 'Option'
    },
},
    { timestamps: true },
);


OptionSchema.method('toJSON', function () {
    const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
    object.id = _id;
    return object;
});

module.exports = model('Option', OptionSchema);