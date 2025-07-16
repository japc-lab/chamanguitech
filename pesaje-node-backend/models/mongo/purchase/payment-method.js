const { Schema, model } = require('mongoose');

const PaymentMethodSchema = Schema({
  name: {
    type: String,
    required: true,
  },
},
  { timestamps: true },
);

PaymentMethodSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('PaymentMethod', PaymentMethodSchema);