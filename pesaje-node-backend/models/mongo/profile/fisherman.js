const { Schema, model } = require('mongoose');

const FishermanSchema = Schema({

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


FishermanSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Fisherman', FishermanSchema);