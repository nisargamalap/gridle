import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.oauthProvider;
    },
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  googleId: { type: String, sparse: true, unique: true },
  oauthProvider: { type: String, enum: ['google', null], default: null },
  image: { type: String, default: '/images/default-avatar.png' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  emailVerified: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  verificationToken: String,
  verificationTokenExpires: Date,
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      frequency: { 
        type: String, 
        enum: ['immediately', 'hourly', 'daily', '15 minutes before', '1 hour before', 'Daily Summary'], 
        default: 'immediately' 
      }
    },
    // ADDED: New preference fields for AI settings
    aiPrioritization: { type: Boolean, default: true },
    aiReminderIntensity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    grammarAutocorrection: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true, 
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.verificationToken;
      delete ret.verificationTokenExpires;
      return ret;
    }
  },
  toObject: { 
    virtuals: true, 
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.verificationToken;
      delete ret.verificationTokenExpires;
      return ret;
    }
  }
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

// Password comparison method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Static methods
UserSchema.statics.findByEmail = async function(email) {
  return this.findOne({ email }).select('+password');
};
UserSchema.statics.findByGoogleId = async function(googleId) {
  return this.findOne({ googleId });
};

// Virtuals
UserSchema.virtual('profileUrl').get(function() {
  return `/users/${this._id}`;
});

// Virtual for groups (to populate)
UserSchema.virtual('groups', {
  ref: 'Group',
  localField: '_id',
  foreignField: 'user'
});

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);