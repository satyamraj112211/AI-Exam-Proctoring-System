const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, default: null },
  },
  { _id: false },
);

const yearSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true }, // e.g. "2024", "First Year"
    sections: { type: [sectionSchema], default: [] },
  },
  { _id: false },
);

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    category: {
      type: String,
      enum: ['tech', 'non-tech'],
      default: 'tech',
    },
    years: { type: [yearSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    type: { type: String, enum: ['university', 'college'], required: true },
    emailDomain: { type: String, trim: true },
    branches: { type: [branchSchema], default: [] },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false },
);

institutionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Institution', institutionSchema);





















