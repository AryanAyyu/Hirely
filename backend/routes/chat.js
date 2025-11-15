import express from 'express';
import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { jobId } = req.query; // Optional filter by job

    const matchStage = {
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    };

    if (jobId) {
      matchStage.jobId = new mongoose.Types.ObjectId(jobId);
    }

    const conversations = await Chat.aggregate([
      {
        $match: matchStage
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            otherUserId: {
              $cond: [
                { $eq: ['$senderId', userId] },
                '$receiverId',
                '$senderId'
              ]
            },
            jobId: '$jobId'
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await User.findById(conv._id.otherUserId).select('name email role');
        let job = null;
        if (conv._id.jobId) {
          job = await Job.findById(conv._id.jobId).select('title _id');
        }
        // Ensure user object is properly serialized
        const userObj = otherUser ? {
          _id: otherUser._id || otherUser.id,
          id: otherUser._id || otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role
        } : null;
        
        const jobObj = job ? {
          _id: job._id || job.id,
          id: job._id || job.id,
          title: job.title
        } : null;
        
        return {
          user: userObj,
          job: jobObj,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json({
      success: true,
      conversations: populatedConversations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/messages/:userId', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;
    const { jobId } = req.query; // Optional filter by job

    const query = {
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    };

    if (jobId) {
      query.jobId = jobId;
    }

    const messages = await Chat.find(query)
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .populate('jobId', 'title _id')
      .populate('applicationId', '_id')
      .sort({ createdAt: 1 });

    await Chat.updateMany(
      { senderId: otherUserId, receiverId: userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get conversations for a specific job (for employers)
router.get('/job/:jobId/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const jobId = req.params.jobId;

    // Verify the user is the employer of this job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employerId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all applications for this job
    const applications = await Application.find({ jobId }).populate('userId', 'name email role');

    // Get conversations for each applicant
    const conversations = await Promise.all(
      applications.map(async (app) => {
        const lastMessage = await Chat.findOne({
          jobId: jobId,
          $or: [
            { senderId: userId, receiverId: app.userId._id },
            { senderId: app.userId._id, receiverId: userId }
          ]
        })
          .sort({ createdAt: -1 })
          .populate('senderId', 'name email');

        const unreadCount = await Chat.countDocuments({
          jobId: jobId,
          senderId: app.userId._id,
          receiverId: userId,
          read: false
        });

        // Ensure user object is properly serialized
        const applicant = app.userId;
        const userObj = applicant ? {
          _id: applicant._id || applicant.id,
          id: applicant._id || applicant.id,
          name: applicant.name,
          email: applicant.email,
          role: applicant.role
        } : null;

        return {
          user: userObj,
          application: {
            _id: app._id,
            status: app.status,
            createdAt: app.createdAt
          },
          job: {
            _id: job._id,
            id: job._id,
            title: job.title
          },
          lastMessage: lastMessage,
          unreadCount: unreadCount
        };
      })
    );

    // Sort by last message time or application time
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt || a.application.createdAt;
      const timeB = b.lastMessage?.createdAt || b.application.createdAt;
      return new Date(timeB) - new Date(timeA);
    });

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if user can send messages to another user (for job seekers - can only reply)
router.get('/can-send-message/:userId', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;
    const { jobId } = req.query;

    // If user is a job seeker, check if employer has sent any messages
    if (req.user.role === 'jobseeker') {
      const query = {
        senderId: otherUserId,
        receiverId: userId
      };

      if (jobId) {
        query.jobId = jobId;
      }

      const existingMessage = await Chat.findOne(query);

      return res.json({
        success: true,
        canSend: !!existingMessage,
        message: existingMessage 
          ? 'You can reply to this conversation' 
          : 'You can only reply to messages. Please wait for the employer to start the conversation.'
      });
    }

    // Employers can always send messages
    res.json({
      success: true,
      canSend: true,
      message: 'You can send messages'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get conversations for applications (for job seekers)
router.get('/my-application-conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all applications by this user
    const applications = await Application.find({ userId })
      .populate('jobId', 'title employerId')
      .populate('jobId.employerId', 'name email role');

    // Get conversations for each application
    const conversations = await Promise.all(
      applications.map(async (app) => {
        const employerId = app.jobId.employerId._id;
        const lastMessage = await Chat.findOne({
          jobId: app.jobId._id,
          $or: [
            { senderId: userId, receiverId: employerId },
            { senderId: employerId, receiverId: userId }
          ]
        })
          .sort({ createdAt: -1 })
          .populate('senderId', 'name email');

        const unreadCount = await Chat.countDocuments({
          jobId: app.jobId._id,
          senderId: employerId,
          receiverId: userId,
          read: false
        });

        // Ensure user object is properly serialized
        const employer = app.jobId.employerId;
        const userObj = employer ? {
          _id: employer._id || employer.id,
          id: employer._id || employer.id,
          name: employer.name,
          email: employer.email,
          role: employer.role
        } : null;

        return {
          user: userObj,
          application: {
            _id: app._id,
            status: app.status,
            createdAt: app.createdAt
          },
          job: {
            _id: app.jobId._id,
            id: app.jobId._id,
            title: app.jobId.title
          },
          lastMessage: lastMessage,
          unreadCount: unreadCount
        };
      })
    );

    // Sort by last message time or application time
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt || a.application.createdAt;
      const timeB = b.lastMessage?.createdAt || b.application.createdAt;
      return new Date(timeB) - new Date(timeA);
    });

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

