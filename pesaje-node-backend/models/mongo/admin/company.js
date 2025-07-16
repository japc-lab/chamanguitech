const { Schema, model } = require('mongoose');

const CompanySchema = Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    unique: true,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
    required: true
  },
  mainTelephone: {
    type: String,
    required: true
  },
  invoiceEmail: {
    type: String,
  },

  mainPersonName: {
    type: String,
    required: true
  },
  managerName: {
    type: String,
  },
  managerCellPhone: {
    type: String,
  },
  managerEmail: {
    type: String,
  },
  commercialAdvisorName: {
    type: String,
  },
  commercialAdvisorCellPhone: {
    type: String,
  },
  commercialAdvisorEmail: {
    type: String,
  },
  aditionalStaffName: {
    type: String,
  },
  positionInCompany: {
    type: String,
  },
  aditionalStaffCellPhone: {
    type: String,
  },
  aditionalStaffEmail: {
    type: String,
  },

  priceListByEmail: {
    type: Boolean,
  },
  priceListByMessagesOrWhatsApp: {
    type: Boolean,
  },
  receivesWholeShrimp: {
    type: Boolean,
  },
  receivesShrimpTails: {
    type: Boolean,
  },
  maxFlavorPercentReceived: {
    type: Number, // e.g., 15 for 15%
  },
  maxMoultingAndSoftnessPercentReceived: {
    type: Number,
  },
  avgWholeShrimpPackagingWeight: {
    type: Number, // specify unit if needed
  },
  avgShrimpTailPackagingWeight: {
    type: Number,
  },
  maxLightFlavorPercentAllowedInWholeShrimp: {
    type: Number,
  },
  maxAndMinTideQuotaReceived: {
    max: {
      type: Number,
    },
    min: {
      type: Number,
    }
  },

  paymentMethod1: {
    type: String, // e.g., "transfer", "cash", "credit"
  },
  paymentMethod2: {
    type: String,
  },
  bank1: {
    type: String, // e.g., "Bank of America"
  },
  bank2: {
    type: String,
  },
  firstPaymentPercent: {
    type: Number, // e.g., 30 for 30%
  },
  daysUntilFirstPayment: {
    type: Number, // e.g., 7 days
  },
  secondPaymentPercent: {
    type: Number,
  },
  daysUntilSecondPayment: {
    type: Number,
  },
  thirdPaymentPercent: {
    type: Number,
  },
  daysUntilThirdPayment: {
    type: Number,
  },
  paymentReliabilityPercent: {
    type: Number, // e.g., 90 for 90% reliable
  },

  isLogisticsSent: {
    type: Boolean,
  },
  minimumQuantityReceivedLb: {
    type: Number, // in pounds (LB)
  },
  custodyCovered: {
    type: Boolean,
  },
  fishingInsuranceCovered: {
    type: Boolean, // for accidents and fishing
  },
  companyClassifierKnown: {
    type: Boolean,
  },
  personCanBeSentForClassification: {
    type: Boolean,
  },
  extraInformation: {
    type: String,
  },
  isLogisticsPayed: {
    type: Boolean,
  },
  wholeAmountToPay: {
    type: Number,
  },
  tailAmountToPay: {
    type: Number,
  },

  classificationQuality: {
    type: String, // e.g., "BAD", "GOOD", "EXCELLENT"
    enum: ['BAD', 'GOOD', 'EXCELLENT'],
  },
  arePaymentsOnTime: {
    type: Boolean, // true = yes, false = no
  },
  observation1: {
    type: String,
  },
  observation2: {
    type: String,
  },
  observation3: {
    type: String,
  },
  observation4: {
    type: String,
  },

  deletedAt: {
    type: Date,
    default: null
  }
},
  { timestamps: true },
);

// 🔹 Auto-increment `code` based on highest code in Company collection
CompanySchema.pre('save', async function (next) {
  if (!this.code) {
    try {
      const Company = this.constructor;
      // Find the highest code (as a number) in the collection
      const highest = await Company.findOne({ code: { $exists: true } })
        .sort({ code: -1 })
        .collation({ locale: 'en_US', numericOrdering: true }); // Ensure numeric sort

      let nextCode = 101;
      if (highest && highest.code) {
        // Parse code as integer, fallback to 0 if not a number
        let highestCode = parseInt(highest.code, 10) || 0;
        // Round down to nearest hundred, then add 100
        nextCode = Math.floor(highestCode / 100) * 100 + 100 + 1;
        // If nextCode ends with something other than 01, set to nearest hundred + 1
        if (nextCode % 100 !== 1) {
          nextCode = Math.floor(nextCode / 100) * 100 + 1;
        }
      }
      this.code = `${nextCode}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

CompanySchema.method('toJSON', function () {
  const { __v, _id, createdAt, updatedAt, ...object } = this.toObject();
  object.id = _id;
  return object;
});

module.exports = model('Company', CompanySchema);