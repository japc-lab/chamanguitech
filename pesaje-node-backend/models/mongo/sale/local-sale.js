const { Schema, model } = require('mongoose');

const LocalSaleSchema = Schema({
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  wholeTotalPounds: {
    type: Number,
    required: true
  },
  tailTotalPounds: {
    type: Number,
    required: true
  },
  wholeRejectedPounds: {
    type: Number,
    required: true
  },
  trashPounds: {
    type: Number,
    required: true
  },
  totalProcessedPounds: {
    type: Number,
    required: true,
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0
  },
  seller: {
    type: String,
    required: true,
  },
  details: [{
    type: Schema.Types.ObjectId,
    ref: 'LocalSaleDetail',
    required: true
  }],
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);

LocalSaleSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('LocalSale', LocalSaleSchema);