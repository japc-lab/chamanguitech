const { Schema, model } = require('mongoose');

const TransportationMethodEnum = require('../../../enums/transportation-method.enum');

const ShrimpFarmSchema = Schema({

  identifier: {
    type: String,
    required: true
  },
  numberHectares: {
    type: Number,
    required: true
  },
  place: {
    type: String,
    required: true
  },
  transportationMethod: {
    type: String,
    enum: TransportationMethodEnum,
    required: true
  },
  distanceToGate: { // meters
    type: Number,
    required: true
  },
  timeFromPedernales: { //minutes
    type: Number,
    required: true
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  buyerItBelongs: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);


ShrimpFarmSchema.index({ client: 1, identifier: 1 }, { unique: true });


ShrimpFarmSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

// 🔹 Ensure indexes are properly synchronized during schema initialization
ShrimpFarmSchema.on('index', (error) => {
  if (error) console.error('❌ Indexing error:', error);
});

module.exports = model('ShrimpFarm', ShrimpFarmSchema);