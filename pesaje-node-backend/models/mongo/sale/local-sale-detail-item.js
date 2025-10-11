const { Schema, model } = require('mongoose');

const LocalSaleDetailItemSchema = Schema({
  size: {
    type: String,
    required: true,
  },
  pounds: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  merchantName: {
    type: String,
    required: true,
  },
  merchantId: {
    type: String,
    required: true,
  },
  paymentOne: {
    type: Number,
    min: 0
  },
  paymentTwo: {
    type: Number,
    min: 0
  },
  totalPaid: {
    type: Number,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['NO_PAYMENT', 'PENDING', 'PAID'],
    required: true
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
  totalReceived: {
    type: Number,
    min: 0
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);


LocalSaleDetailItemSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('LocalSaleDetailItem', LocalSaleDetailItemSchema);