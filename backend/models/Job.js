import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a job title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a job description']
  },
  skills: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    required: [true, 'Please provide a location'],
    trim: true
  },
  salaryRange: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    }
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Remote', 'Contract'],
    required: true
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'pending', 'rejected'],
    default: 'pending'
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: String
}, {
  timestamps: true
});

jobSchema.index({ title: 'text', description: 'text', skills: 'text' });

export default mongoose.model('Job', jobSchema);

