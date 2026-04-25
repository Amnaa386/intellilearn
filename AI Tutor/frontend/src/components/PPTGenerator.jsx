import React, { useState } from 'react';
import { DocumentTextIcon, ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useChat } from '../contexts/ChatContext';

const PPTGenerator = ({ topic, onClose }) => {
  const { generatePPT, downloadPPT } = useChat();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [numSlides, setNumSlides] = useState(8);
  const [pptData, setPptData] = useState(null);
  const [error, setError] = useState('');
  const [generatedTopic, setGeneratedTopic] = useState(topic || '');

  const handleGenerate = async () => {
    if (!generatedTopic.trim()) {
      setError('Please enter a topic for the presentation');
      return;
    }

    if (numSlides < 3 || numSlides > 20) {
      setError('Number of slides must be between 3 and 20');
      return;
    }

    setIsGenerating(true);
    setError('');
    setPptData(null);

    try {
      const response = await generatePPT(generatedTopic.trim(), numSlides);
      setPptData(response);
    } catch (err) {
      setError(err.message || 'Failed to generate PowerPoint');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!pptData?.file_info?.filename) return;

    setIsDownloading(true);
    setError('');

    try {
      await downloadPPT(pptData.file_info.filename);
    } catch (err) {
      setError(err.message || 'Failed to download PowerPoint');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Generate PowerPoint
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create professional presentations
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Topic Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Presentation Topic
              </label>
              <input
                type="text"
                value={generatedTopic}
                onChange={(e) => setGeneratedTopic(e.target.value)}
                placeholder="e.g., Introduction to Machine Learning"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isGenerating}
              />
            </div>

            {/* Number of Slides */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Slides: {numSlides}
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={numSlides}
                onChange={(e) => setNumSlides(parseInt(e.target.value))}
                className="w-full"
                disabled={isGenerating}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>3</span>
                <span>20</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {pptData && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <SparklesIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      PowerPoint Generated Successfully!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {pptData.file_info?.filename} ({formatFileSize(pptData.file_info?.size)})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {!pptData ? (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !generatedTopic.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Generate PowerPoint
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out flex items-center justify-center"
                >
                  {isDownloading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download PowerPoint
                    </>
                  )}
                </button>
              )}

              {onClose && (
                <button
                  onClick={onClose}
                  disabled={isGenerating || isDownloading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PPTGenerator;
