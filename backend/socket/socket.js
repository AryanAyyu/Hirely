import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Application from '../models/Application.js';

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || user.isBlocked) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    socket.join(socket.userId);

    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message, jobId, applicationId } = data;

        // Validate input
        if (!receiverId) {
          console.error('Missing receiverId:', data);
          return socket.emit('error', { message: 'Receiver ID is required' });
        }
        
        if (!message || !message.trim()) {
          console.error('Missing or empty message:', data);
          return socket.emit('error', { message: 'Message is required' });
        }

        // Convert receiverId to string for consistency
        const receiverIdStr = String(receiverId);
        const senderIdStr = String(socket.userId);

        // Check if user is a job seeker trying to initiate a chat
        if (socket.userRole === 'jobseeker') {
          // Check if there are any existing messages from the employer (receiverId) to this job seeker (senderId)
          const query = {
            senderId: receiverIdStr,  // Employer sent message
            receiverId: senderIdStr   // To job seeker
          };

          // If jobId is provided, check for messages specific to that job
          // Otherwise, check for any messages from this employer
          if (jobId) {
            query.jobId = String(jobId);
          }

          const existingMessages = await Chat.findOne(query);

          if (!existingMessages) {
            console.log('Job seeker trying to initiate chat without prior message from employer');
            return socket.emit('error', { 
              message: 'You can only reply to messages. Please wait for the employer to start the conversation.' 
            });
          }
        }

        // Verify application exists if jobId is provided (for job-related chats)
        if (jobId && socket.userRole === 'jobseeker') {
          const application = await Application.findOne({
            jobId: String(jobId),
            userId: senderIdStr
          });

          if (!application) {
            return socket.emit('error', { 
              message: 'You can only chat about jobs you have applied for.' 
            });
          }
        }

        // Create the chat message
        const chatMessage = await Chat.create({
          senderId: senderIdStr,
          receiverId: receiverIdStr,
          message: message.trim(),
          jobId: jobId ? String(jobId) : null,
          applicationId: applicationId ? String(applicationId) : null
        });

        const populatedMessage = await Chat.findById(chatMessage._id)
          .populate('senderId', 'name email')
          .populate('receiverId', 'name email')
          .populate('jobId', 'title _id')
          .populate('applicationId', '_id');

        io.to(receiverId).emit('receive_message', populatedMessage);
        socket.emit('message_sent', populatedMessage);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('typing', (data) => {
      socket.to(data.receiverId).emit('user_typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

