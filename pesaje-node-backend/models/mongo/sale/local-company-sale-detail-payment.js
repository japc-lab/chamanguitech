const { Schema, model } = require('mongoose');

const LocalCompanySaleDetailPaymentSchema = Schema({
  localCompanySaleDetail: {
    type: Schema.Types.ObjectId,
    ref: 'LocalCompanySaleDetail',
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
  accountName: {
    type: String,
    required: true,
  },
  observation: {
    type: String,
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);

LocalCompanySaleDetailPaymentSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('LocalCompanySaleDetailPayment', LocalCompanySaleDetailPaymentSchema);

