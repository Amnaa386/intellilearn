/**
 * API Handler for communicating with Python backend
 * Production-ready fetch-based API client
 */

const API_BASE_URL = 'http://localhost:8000'; // Updated to match backend port

// Default configuration
const defaultConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
};

/**
 * Generic fetch wrapper with error handling
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise} - Parsed JSON response
 */
async function apiFetch(url, options = {}) {
  try {
    // Merge default config with provided options
    const config = {
      ...defaultConfig,
      ...options,
      headers: {
        ...defaultConfig.headers,
        ...options.headers,
      },
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), defaultConfig.timeout);

    // Make the request
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...config,
      signal: controller.signal,
    });

    // Clear timeout
    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || 
        errorData.message || 
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    // Parse and return JSON response
    return await response.json();
  } catch (error) {
    // Handle different error types
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Please try again');
    } else if (error instanceof TypeError) {
      throw new Error('Network error - Please check your connection');
    } else {
      // Re-throw the original error
      throw error;
    }
  }
}

/**
 * Send a message to the chat API
 * @param {string} message - The message to send
 * @param {object} options - Additional options
 * @returns {Promise} - API response
 */
export async function sendMessage(message, options = {}) {
  try {
    const response = await apiFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: message,
        ...options
      }),
    });
    
    return response;
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
}

/**
 * Get chat sessions
 * @returns {Promise} - List of chat sessions
 */
export async function getChatSessions() {
  try {
    const response = await apiFetch('/chat/sessions');
    return response;
  } catch (error) {
    console.error('Get Sessions Error:', error);
    throw error;
  }
}

/**
 * Create a new chat session
 * @param {string} title - Session title
 * @returns {Promise} - Created session data
 */
export async function createChatSession(title) {
  try {
    const response = await apiFetch('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    return response;
  } catch (error) {
    console.error('Create Session Error:', error);
    throw error;
  }
}

/**
 * Get a specific chat session
 * @param {string} sessionId - Session ID
 * @returns {Promise} - Session data with messages
 */
export async function getChatSession(sessionId) {
  try {
    const response = await apiFetch(`/chat/sessions/${sessionId}`);
    return response;
  } catch (error) {
    console.error('Get Session Error:', error);
    throw error;
  }
}

/**
 * Delete a chat session
 * @param {string} sessionId - Session ID
 * @returns {Promise} - Delete confirmation
 */
export async function deleteChatSession(sessionId) {
  try {
    const response = await apiFetch(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Delete Session Error:', error);
    throw error;
  }
}

/**
 * User authentication
 */
export const auth = {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Authentication response
   */
  async login(email, password) {
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });
      return response;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  /**
   * Register user
   * @param {object} userData - User registration data
   * @returns {Promise} - Registration response
   */
  async register(userData) {
    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response;
    } catch (error) {
      console.error('Register Error:', error);
      throw error;
    }
  },

  /**
   * Get current user info
   * @param {string} token - JWT token
   * @returns {Promise} - User data
   */
  async getCurrentUser(token) {
    try {
      const response = await apiFetch('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      console.error('Get Current User Error:', error);
      throw error;
    }
  },
};

/**
 * Health check
 * @returns {Promise} - Server health status
 */
export async function healthCheck() {
  try {
    const response = await apiFetch('/health');
    return response;
  } catch (error) {
    console.error('Health Check Error:', error);
    throw error;
  }
}

/**
 * PPT Generation
 * @param {string} topic - Topic for PPT generation
 * @param {number} numSlides - Number of slides for PPT generation
 * @returns {Promise} - PPT generation response
 */
export async function generatePPT(topic, numSlides = 8) {
  try {
    const response = await apiFetch('/generate-ppt', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        num_slides: numSlides
      })
    });
    return response;
  } catch (error) {
    console.error('PPT Generation Error:', error);
    throw error;
  }
}

/**
 * Download PPT
 * @param {string} filename - Filename for PPT download
 * @returns {Promise} - PPT download response
 */
export async function downloadPPT(filename) {
  try {
    const response = await fetch(`${API_BASE_URL}/download-ppt?file=${filename}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  } catch (error) {
    console.error('PPT Download Error:', error);
    throw error;
  }
}

// Export default API client
const api = {
  sendMessage,
  getChatSessions,
  createChatSession,
  getChatSession,
  deleteChatSession,
  auth,
  healthCheck,
  generatePPT,
  downloadPPT,
};

export default api;
