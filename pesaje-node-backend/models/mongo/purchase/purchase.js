const { Schema, model } = require('mongoose');

const PurchaseStatusEnum = require('../../../enums/purchase-status.enum');

const PurchaseSchema = Schema({
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: function () { return this.status !== 'DRAFT'; }
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: function () { return this.status !== 'DRAFT'; }
  },
  localSellCompany: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: function () { return this.status !== 'DRAFT'; }
  },
  broker: {
    type: Schema.Types.ObjectId,
    ref: 'Broker',
    required: function () { return this.status !== 'DRAFT'; }
  },
  fisherman: {
    type: Schema.Types.ObjectId,
    ref: 'Fisherman',
    required: function () { return this.status !== 'DRAFT'; }
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: function () { return this.status !== 'DRAFT'; }
  },
  shrimpFarm: {
    type: Schema.Types.ObjectId,
    ref: 'ShrimpFarm',
    required: function () { return this.status !== 'DRAFT'; }
  },
  period: {
    type: Schema.Types.ObjectId,
    ref: 'Period',
  },
  controlNumber: { // Auto-incremented
    type: String,
  },
  purchaseDate: {
    type: Date,
    required: function () { return this.status !== 'DRAFT'; },
  },
  averageGrams: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  price: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  pounds: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
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
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  subtotal: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  subtotal2: {
    type: Number,
    min: 0
  },
  grandTotal: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  totalAgreedToPay: {
    type: Number,
    required: function () { return this.status !== 'DRAFT'; },
    min: 0
  },
  hasInvoice: {
    type: String,
    required: function () { return this.status !== 'DRAFT'; },
    enum: ['yes', 'no', 'not-applicable']
  },
  invoiceNumber: {
    type: String,
    sparse: true // Allows multiple `null` values while keeping uniqueness for non-null values
  },
  invoiceName: {
    type: String,
  },
  weightSheetNumber: {
    type: String,
    required: function () { return this.status !== 'DRAFT'; },
  },
  status: {
    type: String,
    enum: PurchaseStatusEnum,
    required: true,
    default: 'DRAFT'
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
  { client: 1, invoiceNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { invoiceNumber: { $exists: true } }
  }
);

// 🔹 Unique index for controlNumber only when it exists and is not null
PurchaseSchema.index(
  { controlNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { controlNumber: { $exists: true, $type: 'string' } }
  }
);

// 🔹 Auto-increment `controlNumber`
PurchaseSchema.pre('save', async function (next) {
  if (!this.controlNumber) {
    try {
      // Only generate control number when saving as CREATED
      if (this.status !== 'CREATED') {
        return next();
      }

      // Company is required to generate control number
      if (!this.company) {
        return next(new Error('Company not found when generating controlNumber'));
      }

      const Counter = require('../control/counter');
      const Company = require('../admin/company');

      const company = await Company.findById(this.company);
      if (!company) {
        return next(new Error('Company not found when generating controlNumber'));
      }

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

// 🔹 Generate controlNumber on first update when company is present and controlNumber is missing
PurchaseSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate() || {};
    const $set = update.$set || update;
    // If controlNumber already set in DB or in this update, skip
    const currentDoc = await this.model.findOne(this.getQuery());
    if (!currentDoc) return next();
    const hasControl = currentDoc.controlNumber || $set.controlNumber;
    const companyId = $set.company || currentDoc.company;
    // Only generate control number on updates that explicitly set status to CREATED
    if (hasControl || !companyId || $set.status !== 'CREATED') return next();

    const Counter = require('../control/counter');
    const Company = require('../admin/company');
    const company = await Company.findById(companyId);
    if (!company) return next(new Error('Company not found when generating controlNumber'));

    const counterKey = company.name === 'Local' ? 'Purchase_Local' : 'Purchase_Company';
    const prefix = company.name === 'Local' ? 'LC' : 'CO';
    const counter = await Counter.findOneAndUpdate(
      { model: counterKey },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    if (counter) {
      // Ensure we mutate the update payload
      if (!update.$set) update.$set = {};
      update.$set.controlNumber = `${prefix}-${counter.seq}`;
      this.setUpdate(update);
    }
    return next();
  } catch (err) {
    return next(err);
  }
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