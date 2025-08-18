const { Schema, model } = require('mongoose');

const LogisticsPaymentSchema = Schema({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['NO_PAYMENT', 'PENDING', 'PAID'],
    required: true
  },
  paymentDate: {
    type: Date,
    required: function () {
      return this.paymentStatus === 'PAID';
    }
  },
  paymentMethod: {
    type: Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: function () {
      return this.paymentStatus === 'PAID';
    }
  },
  hasInvoice: {
    type: String,
    enum: ['yes', 'no', 'not-applicable'],
    required: true
  },
  invoiceNumber: {
    type: String,
    required: function () {
      return this.hasInvoice === 'yes';
    }
  },
  invoiceName: {
    type: String,
    required: function () {
      return this.hasInvoice === 'yes';
    }
  },
  personInCharge: {
    type: String,
    required: function () {
      return this.paymentStatus === 'PAID';
    }
  },
  isCompleted: {
    type: Boolean,
    default: false
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


LogisticsPaymentSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('LogisticsPayment', LogisticsPaymentSchema);