import Chat from '../models/Chat.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const setupSocketHandlers = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name}`);
    
    // Join user to their own room
    socket.join(socket.user._id.toString());
    
    // Handle joining group chat rooms
    socket.on('joinGroupChat', (groupId) => {
      socket.join(`group:${groupId}`);
      console.log(`${socket.user.name} joined group chat: ${groupId}`);
    });
    
    // Handle joining direct chat rooms
    socket.on('joinDirectChat', (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`${socket.user.name} joined direct chat: ${chatId}`);
    });
    
    // Handle sending messages to group chats
    socket.on('sendGroupMessage', async ({ groupId, content }) => {
      try {
        const chat = await Chat.findOne({ group: groupId });
        
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }
        
        const message = {
          sender: socket.user._id,
          content,
          createdAt: new Date()
        };
        
        chat.messages.push(message);
        await chat.save();
        
        const populatedMessage = {
          ...message,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email,
            avatar: socket.user.avatar
          }
        };
        
        io.to(`group:${groupId}`).emit('newGroupMessage', {
          groupId,
          message: populatedMessage
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle sending messages to direct chats
    socket.on('sendDirectMessage', async ({ chatId, receiverId, content }) => {
      try {
        let chat = await Chat.findById(chatId);
        
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }
        
        const message = {
          sender: socket.user._id,
          content,
          createdAt: new Date()
        };
        
        chat.messages.push(message);
        await chat.save();
        
        const populatedMessage = {
          ...message,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email,
            avatar: socket.user.avatar
          }
        };
        
        // Send to all users in the chat room
        io.to(`chat:${chatId}`).emit('newDirectMessage', {
          chatId,
          message: populatedMessage
        });
        
        // Also send to the specific user's room if they're not in the chat room
        socket.to(receiverId).emit('newDirectMessage', {
          chatId,
          message: populatedMessage
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Handle typing indicators
    socket.on('typing', ({ chatId, isGroup }) => {
      const room = isGroup ? `group:${chatId}` : `chat:${chatId}`;
      socket.to(room).emit('userTyping', {
        user: {
          _id: socket.user._id,
          name: socket.user.name
        },
        chatId
      });
    });
    
    socket.on('stopTyping', ({ chatId, isGroup }) => {
      const room = isGroup ? `group:${chatId}` : `chat:${chatId}`;
      socket.to(room).emit('userStoppedTyping', {
        user: {
          _id: socket.user._id,
          name: socket.user.name
        },
        chatId
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
};