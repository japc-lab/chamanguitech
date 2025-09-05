const { Schema, model } = require('mongoose');

const AssetSchema = Schema({
  code: { // Auto-incremented
    type: String,
  },
  name: {
    type: String,
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  units: {
    type: Number,
    required: true,
    min: 1
  },
  totalCost: {
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
    enum: ['good', 'bad', 'neutral']
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

// 🔹 Unique index for code only when it exists and is not null
AssetSchema.index(
  { code: 1 },
  {
    unique: true,
    partialFilterExpression: { code: { $exists: true, $type: 'string' } }
  }
);

// 🔹 Auto-increment `code`
AssetSchema.pre('save', async function (next) {
  // Auto-generate code
  if (!this.code) {
    try {
      const Counter = require('../control/counter');
      
      const counter = await Counter.findOneAndUpdate(
        { model: 'Asset' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      if (counter) {
        this.code = `A-${counter.seq}`;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// 🔹 Generate code on first update when missing
AssetSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate() || {};
    const $set = update.$set || update;
    
    // Get current document for reference
    const currentDoc = await this.model.findOne(this.getQuery());
    if (!currentDoc) return next();
    
    // Generate code if missing
    const hasCode = currentDoc.code || $set.code;
    if (!hasCode) {
      const Counter = require('../control/counter');
      
      const counter = await Counter.findOneAndUpdate(
        { model: 'Asset' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      if (counter) {
        if (!update.$set) update.$set = {};
        update.$set.code = `A-${counter.seq}`;
        this.setUpdate(update);
      }
    }
    
    return next();
  } catch (err) {
    return next(err);
  }
});

AssetSchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

// 🔹 Ensure indexes are properly synchronized during schema initialization
AssetSchema.on('index', (error) => {
  if (error) console.error('❌ Asset indexing error:', error);
});

module.exports = model('Asset', AssetSchema);

