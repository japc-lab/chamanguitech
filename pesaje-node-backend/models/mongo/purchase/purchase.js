const { Schema, model } = require('mongoose');

const PurchaseStatusEnum = require('../../../enums/purchase-status.enum');

const PurchaseSchema = Schema({
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  broker: {
    type: Schema.Types.ObjectId,
    ref: 'Broker',
    required: true
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  shrimpFarm: {
    type: Schema.Types.ObjectId,
    ref: 'ShrimpFarm',
    required: true
  },
  period: {
    type: Schema.Types.ObjectId,
    ref: 'Period',
  },
  controlNumber: { // Auto-incremented
    type: String,
    unique: true
  },
  purchaseDate: {
    type: Date,
    required: true,
  },
  averageGrams: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  pounds: {
    type: Number,
    required: true,
    min: 0
  },
  averageGrams2: {
    type: Number,
    min: 0
  },
  price2: {
    type: Number,
    min: 0
  },
  pounds2: {
    type: Number,
    min: 0
  },
  totalPounds: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal2: {
    type: Number,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  totalAgreedToPay: {
    type: Number,
    required: true,
    min: 0
  },
  hasInvoice: {
    type: Boolean,
    required: true,
  },
  invoice: {
    type: String,
    sparse: true // Allows multiple `null` values while keeping uniqueness for non-null values
  },
  status: {
    type: String,
    enum: PurchaseStatusEnum,
    required: true,
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);


// 🔹 Unique index for invoice per client (only when invoice is not null)
PurchaseSchema.index(
  { client: 1, invoice: 1 },
  {
    unique: true,
    partialFilterExpression: { invoice: { $exists: true } }
  }
);

// 🔹 Auto-increment `controlNumber`
PurchaseSchema.pre('save', async function (next) {
  if (!this.controlNumber) {
    try {
      const Counter = require('../control/counter'); // Lazy import
      const Company = require('../admin/company'); // Lazy import of Company model

      const company = await Company.findById(this.company);
      if (!company) {
        return next(new Error('Company not found when generating controlNumber'));
      }

      // Determine counter key based on company name
      const counterKey = company.name === 'Local' ? 'Purchase_Local' : 'Purchase_Company';
      const prefix = company.name === 'Local' ? 'LC' : 'CO';

      const counter = await Counter.findOneAndUpdate(
        { model: counterKey },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      if (counter) {
        this.controlNumber = `${prefix}-${counter.seq}`;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});



PurchaseSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

// 🔹 Ensure indexes are properly synchronized during schema initialization
PurchaseSchema.on('index', (error) => {
  if (error) console.error('❌ Indexing error:', error);
});

module.exports = model('Purchase', PurchaseSchema);