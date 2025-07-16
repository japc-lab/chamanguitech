const { Schema, model } = require('mongoose');

const PurchasePaymentMethodSchema = Schema({
  purchase: {
    type: Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true
  },
  paymentMethod: {
    type: Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    required: true,
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);

PurchasePaymentMethodSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('PurchasePaymentMethod', PurchasePaymentMethodSchema);