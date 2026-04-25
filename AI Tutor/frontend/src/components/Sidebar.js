import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, ChatBubbleLeftRightIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useChat } from '../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';

const Sidebar = ({ sessions, currentSession, onSelectSession, onClose }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { createSession, deleteSession } = useChat();

  const handleCreateSession = async () => {
    const newSession = await createSession('New Chat');
    if (newSession) {
      onSelectSession(newSession);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (deleteConfirm === sessionId) {
      await deleteSession(sessionId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(sessionId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chat History
          </h2>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateSession}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Chat</span>
        </motion.button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <AnimatePresence>
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No chat sessions yet
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Start a new conversation to see it here
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => onSelectSession(session)}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    currentSession?.id === session.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {session.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(session.updated_at || session.created_at)}
                      </p>
                      {session.messages && session.messages.length > 0 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {session.messages.length} messages
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className={`p-1 rounded transition-all duration-200 ${
                        deleteConfirm === session.id
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                      }`}
                    >
                      {deleteConfirm === session.id ? (
                        <span className="text-xs font-medium">Sure?</span>
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>AI Learning Platform</p>
          <p className="mt-1">Powered by Multiple AI Services</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
