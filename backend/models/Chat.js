import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null
  }
}, {
  timestamps: true
});

chatSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
chatSchema.index({ jobId: 1, applicationId: 1 });
chatSchema.index({ senderId: 1, receiverId: 1, jobId: 1 });

export default mongoose.model('Chat', chatSchema);

