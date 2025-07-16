const { Schema, model } = require('mongoose');

const PaymentInfoSchema = Schema({
    bankName: {
        type: String,
        required: true
    },
    accountName: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    identification: {
        type: String,
        required: true
    },
    mobilePhone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    person: {
        type: Schema.Types.ObjectId,
        ref: 'Person'
    },
    deletedAt: {
        type: Date,
        default: null
    }
},
    { timestamps: true },
);


PaymentInfoSchema.method('toJSON', function () {
    const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
    object.id = _id;
    return object;
});

module.exports = model('PaymentInfo', PaymentInfoSchema);