import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSocket, initSocket } from '../utils/socket';
import apiService from '../utils/api';

const Chat = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [socket, setSocket] = useState(null);
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    try {
      let data;
      if (user?.role === 'employer' && jobId) {
        // Load conversations for a specific job (employer view)
        data = await apiService.getJobConversations(jobId);
      } else if (user?.role === 'jobseeker') {
        // Load conversations for job seeker's applications
        data = await apiService.getMyApplicationConversations();
      } else {
        // General conversations
        data = await apiService.getConversations(jobId);
      }
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Helper function to extract ID from user object (handles both _id and id, ObjectId and string)
  const extractUserId = (userObj) => {
    if (!userObj) return null;
    if (userObj._id) {
      return typeof userObj._id === 'string' ? userObj._id : String(userObj._id);
    }
    if (userObj.id) {
      return typeof userObj.id === 'string' ? userObj.id : String(userObj.id);
    }
    return null;
  };

  // Helper function to normalize user object for consistent ID access
  const normalizeUser = (userObj) => {
    if (!userObj) return null;
    const id = extractUserId(userObj);
    if (!id) return null;
    return {
      ...userObj,
      _id: id,
      id: id
    };
  };

  const loadMessages = async (targetUserId, targetJobId = null) => {
    try {
      // Normalize targetUserId to string for comparison
      const targetUserIdStr = String(targetUserId);
      
      const data = await apiService.getMessages(targetUserIdStr, targetJobId);
      setMessages(data.messages || []);
      
      // Get job info from messages if available
      const firstMessageWithJob = data.messages?.find(m => m.jobId);
      if (firstMessageWithJob?.jobId) {
        const jobId = firstMessageWithJob.jobId._id || firstMessageWithJob.jobId.id || firstMessageWithJob.jobId;
        setSelectedJob({ ...firstMessageWithJob.jobId, _id: String(jobId), id: String(jobId) });
      }
      
      // Check if user can send messages
      try {
        const canSendData = await apiService.canSendMessage(targetUserIdStr, targetJobId);
        setCanSendMessage(canSendData.canSend);
        setErrorMessage(canSendData.canSend ? '' : canSendData.message);
      } catch (error) {
        console.error('Error checking can send message:', error);
        // Default to allowing if check fails (for employers)
        setCanSendMessage(user?.role === 'employer');
      }
      
      // Find the conversation to get job and application info
      // Use a callback to access current conversations state
      setConversations((currentConversations) => {
        const targetConversation = currentConversations.find((conv) => {
          const convUserId = extractUserId(conv.user);
          const matchesUser = convUserId && String(convUserId) === targetUserIdStr;
          const matchesJob = !targetJobId || (conv.job && (String(conv.job._id || conv.job.id) === String(targetJobId)));
          return matchesUser && matchesJob;
        });
        
        if (targetConversation) {
          const normalizedUser = normalizeUser(targetConversation.user);
          if (normalizedUser) {
            setSelectedUser(normalizedUser);
          }
          if (targetConversation.job) {
            const jobId = extractUserId(targetConversation.job);
            setSelectedJob({ ...targetConversation.job, _id: jobId, id: jobId });
          }
          if (targetConversation.application) {
            setSelectedApplication(targetConversation.application);
          }
        } else {
          // Fallback: get user info from first message
          const firstMessage = data.messages?.[0];
          if (firstMessage) {
            const senderId = extractUserId(firstMessage.senderId);
            const receiverId = extractUserId(firstMessage.receiverId);
            const currentUserId = extractUserId(user);
            const isSender = senderId && currentUserId && String(senderId) === String(currentUserId);
            
            const otherUser = isSender ? firstMessage.receiverId : firstMessage.senderId;
            const normalizedOtherUser = normalizeUser(otherUser);
            if (normalizedOtherUser) {
              setSelectedUser(normalizedOtherUser);
            }
            
            if (firstMessage.jobId) {
              const jobId = extractUserId(firstMessage.jobId);
              setSelectedJob({ ...firstMessage.jobId, _id: jobId, id: jobId });
            }
          }
        }
        return currentConversations;
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  useEffect(() => {
    const socketInstance = initSocket();
    setSocket(socketInstance);

    if (socketInstance) {
      socketInstance.on('receive_message', (message) => {
        // Check if message is for current user
        const receiverId = message.receiverId?._id || message.receiverId?.id || message.receiverId;
        const currentUserId = user?.id || user?._id;
        const isForCurrentUser = String(receiverId) === String(currentUserId);
        
        // If job seeker receives a message from employer, enable sending
        if (isForCurrentUser && user?.role === 'jobseeker') {
          const senderId = message.senderId?._id || message.senderId?.id || message.senderId;
          const selectedUserId = selectedUser?._id || selectedUser?.id;
          const isFromEmployer = message.senderId?.role === 'employer' || 
                                 (selectedUser && String(senderId) === String(selectedUserId));
          if (isFromEmployer) {
            setCanSendMessage(true);
            setErrorMessage('');
          }
        }

        // Only add message if it's for the current conversation
        setMessages((prev) => {
          if (!selectedUser) {
            // If no conversation selected, still add if it's for current user
            if (isForCurrentUser && !prev.find(m => m._id === message._id)) {
              return [...prev, message];
            }
            return prev;
          }

          const senderId = message.senderId?._id || message.senderId?.id || message.senderId;
          const selectedUserId = selectedUser?._id || selectedUser?.id;
          const isCurrentConversation = 
            String(senderId) === String(selectedUserId) ||
            String(receiverId) === String(selectedUserId);
          
          if (isCurrentConversation && !prev.find(m => m._id === message._id)) {
            return [...prev, message];
          }
          return prev;
        });
        
        // Refresh conversations to update last message
        loadConversations();
      });

      socketInstance.on('message_sent', (message) => {
        setMessages((prev) => {
          if (!prev.find(m => m._id === message._id)) {
            return [...prev, message];
          }
          return prev;
        });
        loadConversations();
      });

      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
        setErrorMessage(error.message || 'An error occurred');
        // If it's a permission error, update canSendMessage
        if (error.message && error.message.includes('can only reply')) {
          setCanSendMessage(false);
        }
      });

      socketInstance.on('new_application', (data) => {
        console.log('New application notification:', data);
        loadConversations();
      });

      socketInstance.on('application_status_changed', (data) => {
        console.log('Application status changed:', data);
      });
    }

    const initializeChat = async () => {
      await loadConversations();
      if (userId) {
        // Small delay to ensure conversations state is updated
        setTimeout(() => {
          loadMessages(userId, jobId);
        }, 200);
      }
    };

    initializeChat();

    return () => {
      if (socketInstance) {
        socketInstance.off('receive_message');
        socketInstance.off('message_sent');
        socketInstance.off('error');
        socketInstance.off('new_application');
        socketInstance.off('application_status_changed');
      }
    };
  }, [userId, jobId, user?.role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !socket || !selectedUser || !canSendMessage) {
      if (!selectedUser) {
        setErrorMessage('Please select a conversation');
      }
      return;
    }

    // Extract receiverId using helper function
    const receiverId = extractUserId(selectedUser);

    if (!receiverId) {
      console.error('Selected user object:', selectedUser);
      setErrorMessage('Invalid receiver. Please refresh and try again.');
      return;
    }

    const currentJobId = selectedJob ? extractUserId(selectedJob) : (jobId || null);
    const currentApplicationId = selectedApplication ? extractUserId(selectedApplication) : null;

    setErrorMessage(''); // Clear any previous errors
    
    const messageData = {
      receiverId,
      message: messageText.trim(),
      jobId: currentJobId,
      applicationId: currentApplicationId,
    };

    console.log('Sending message:', messageData); // Debug log
    
    socket.emit('send_message', messageData);

    setMessageText('');
  };

  const selectConversation = (conversation) => {
    // Normalize user object to ensure _id is accessible
    const normalizedUser = normalizeUser(conversation.user);
    if (normalizedUser) {
      setSelectedUser(normalizedUser);
    } else {
      console.error('Failed to normalize user:', conversation.user);
      setErrorMessage('Error loading conversation. Please try again.');
      return;
    }
    
    if (conversation.job) {
      const jobId = extractUserId(conversation.job);
      setSelectedJob({ ...conversation.job, _id: jobId, id: jobId });
    } else {
      setSelectedJob(null);
    }
    
    setSelectedApplication(conversation.application || null);
    
    const targetUserId = extractUserId(conversation.user);
    const targetJobId = conversation.job ? extractUserId(conversation.job) : (jobId || null);
    
    if (targetUserId) {
      loadMessages(targetUserId, targetJobId);
    } else {
      console.error('Failed to extract user ID from conversation:', conversation);
      setErrorMessage('Error loading conversation. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Chat</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Conversations</h2>
            <div className="space-y-2">
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <button
                    key={`${conv.user._id || conv.user.id}-${conv.job?._id || 'no-job'}`}
                    onClick={() => selectConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedUser?._id === conv.user._id ||
                      selectedUser?.id === conv.user.id
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{conv.user.name}</p>
                        {conv.job && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                            📋 {conv.job.title}
                          </p>
                        )}
                        {conv.application && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Status: <span className="capitalize">{conv.application.status}</span>
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                          {conv.lastMessage?.message || 'No messages yet'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="badge badge-primary ml-2 flex-shrink-0">{conv.unreadCount}</span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  No conversations yet
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card flex flex-col" style={{ height: '600px' }}>
            {selectedUser ? (
              <>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                      {selectedJob && (
                        <div className="mt-2">
                          <Link
                            to={`/jobs/${selectedJob._id}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            📋 {selectedJob.title}
                          </Link>
                        </div>
                      )}
                      {selectedApplication && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Application Status: <span className="capitalize font-medium">{selectedApplication.status}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedUser.role === 'employer' ? '👔 Employer' : '👤 Job Seeker'}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <p>No messages yet. {user?.role === 'employer' ? 'Start the conversation!' : 'Waiting for employer to message you...'}</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      // Check if message is sent by current user
                      const senderId = message.senderId?._id || message.senderId?.id || message.senderId;
                      const currentUserId = user?.id || user?._id;
                      const isOwn = String(senderId) === String(currentUserId);
                      
                      return (
                        <div
                          key={message._id || message.createdAt}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs font-semibold mb-1 opacity-75">
                                {message.senderId?.name || 'Unknown'}
                              </p>
                            )}
                            <p className="break-words">{message.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {errorMessage && (
                  <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 rounded text-sm text-yellow-800 dark:text-yellow-200">
                    {errorMessage}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className={`input flex-1 ${!canSendMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder={
                      canSendMessage 
                        ? "Type a message..." 
                        : "You can only reply to messages. Please wait for the employer to start the conversation."
                    }
                    disabled={!canSendMessage}
                  />
                  <button 
                    type="submit" 
                    className={`btn btn-primary ${!canSendMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!canSendMessage}
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-400">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

