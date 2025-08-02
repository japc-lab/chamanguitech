const { Schema, model } = require('mongoose');

const MerchantSchema = Schema({

  person: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);


MerchantSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Merchant', MerchantSchema);