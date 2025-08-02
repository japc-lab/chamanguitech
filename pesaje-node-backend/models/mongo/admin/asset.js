const { Schema, model } = require('mongoose');

const AssetSchema = Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
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