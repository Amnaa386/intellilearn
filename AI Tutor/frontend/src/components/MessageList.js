import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserIcon, SparklesIcon, DocumentTextIcon, QuestionMarkCircleIcon, PresentationChartBarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const MessageList = ({ messages, onGeneratePPT }) => {
  const getIntentIcon = (intentType) => {
    switch (intentType) {
      case 'explanation':
        return <SparklesIcon className="h-4 w-4 text-blue-500" />;
      case 'notes':
        return <DocumentTextIcon className="h-4 w-4 text-green-500" />;
      case 'quiz':
        return <QuestionMarkCircleIcon className="h-4 w-4 text-purple-500" />;
      case 'ppt':
        return <PresentationChartBarIcon className="h-4 w-4 text-orange-500" />;
      default:
        return <SparklesIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getIntentLabel = (intentType) => {
    switch (intentType) {
      case 'explanation':
        return 'Explanation';
      case 'notes':
        return 'Study Notes';
      case 'quiz':
        return 'Quiz Generated';
      case 'ppt':
        return 'Presentation';
      default:
        return 'AI Response';
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  const renderStructuredContent = (structuredContent) => {
    if (!structuredContent) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-2 mb-3">
          {getIntentIcon(structuredContent.type)}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getIntentLabel(structuredContent.type)}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
          {JSON.stringify(structuredContent, null, 2)}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4 p-4">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-3xl ${message.message_type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 ${message.message_type === 'user' ? 'ml-3' : 'mr-3'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.message_type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                }`}>
                  {message.message_type === 'user' ? (
                    <UserIcon className="h-5 w-5" />
                  ) : (
                    <SparklesIcon className="h-5 w-5" />
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className={`flex-1 ${message.message_type === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`inline-block px-4 py-3 rounded-2xl ${
                    message.message_type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Intent indicator for assistant messages */}
                  {message.message_type === 'assistant' && message.intent_type && (
                    <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                      {getIntentIcon(message.intent_type)}
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {getIntentLabel(message.intent_type)}
                      </span>
                    </div>
                  )}

                  {/* Message text */}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>

                  {/* Structured content */}
                  {message.structured_content && renderStructuredContent(message.structured_content)}

                  {/* PPT Download button for PPT intent messages */}
                  {message.message_type === 'assistant' && message.intent_type === 'ppt' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => onGeneratePPT && onGeneratePPT(message.content)}
                        className="flex items-center space-x-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-md transition-colors duration-200"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span>Download PowerPoint</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                  message.message_type === 'user' ? 'mr-2' : 'ml-2'
                }`}>
                  {formatTime(message.created_at)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;
