const { Schema, model } = require('mongoose');

const AssetSchema = Schema({
  name: {
    type: String,
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  desiredLife: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['paid', 'pending']
  },
  paidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  pendingAmount: {
    type: Number,
    required: true,
    min: 0
  },
  responsible: {
    type: String,
    required: true
  },
  location: {
    type: String,
  },
  currentSituation: {
    type: String,
  },
  disposalDate: {
    type: Date,
  },
  daysOfUse: {
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

AssetSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Asset', AssetSchema);

