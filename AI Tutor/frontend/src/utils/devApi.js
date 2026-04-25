/**
 * Development API client for bypassing authentication
 */

const DEV_API_BASE_URL = 'http://localhost:8000/dev';

export const devApi = {
    // Send message without authentication
    async sendMessage(messages, userQuery, context = null, sessionId = null) {
        try {
            console.log('🔓 Sending message via dev API:', userQuery);
            
            const requestData = {
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp
                })),
                user_query: userQuery,
                context: context,
                session_id: sessionId,
                user_preferences: {}
            };

            const response = await fetch(`${DEV_API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Dev-Mode': 'true'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Dev API Error: ${errorData.error || 'Unknown error'}`);
            }

            const responseData = await response.json();
            
            console.log('✅ Dev API Response:', {
                provider: responseData.provider_used,
                intent: responseData.intent_detected,
                confidence: responseData.confidence_score,
                responseTime: responseData.response_time
            });

            return {
                content: responseData.response,
                intent_type: responseData.content_type,
                intent_detected: responseData.intent_detected,
                confidence_score: responseData.confidence_score,
                provider_used: responseData.provider_used,
                response_time: responseData.response_time,
                structured_data: responseData.structured_data,
                metadata: {
                    ...responseData.metadata,
                    dev_mode: true,
                    auth_bypassed: true
                }
            };

        } catch (error) {
            console.error('❌ Dev API Error:', error);
            throw error;
        }
    },

    // Detect intent without authentication
    async detectIntent(query) {
        try {
            console.log('🔓 Detecting intent via dev API:', query);
            
            const response = await fetch(`${DEV_API_BASE_URL}/detect-intent?query=${encodeURIComponent(query)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Dev-Mode': 'true'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Intent Detection Error: ${errorData.error || 'Unknown error'}`);
            }

            const responseData = await response.json();
            
            console.log('✅ Intent Detection Result:', {
                intent: responseData.intent,
                confidence: responseData.confidence,
                complexity: responseData.complexity_score
            });

            return responseData;

        } catch (error) {
            console.error('❌ Intent Detection Error:', error);
            throw error;
        }
    },

    // Test AI providers without authentication
    async testProviders() {
        try {
            console.log('🔓 Testing AI providers via dev API');
            
            const response = await fetch(`${DEV_API_BASE_URL}/test-ai-providers`, {
                method: 'GET',
                headers: {
                    'X-Dev-Mode': 'true'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Provider Test Error: ${errorData.error || 'Unknown error'}`);
            }

            const responseData = await response.json();
            
            console.log('✅ Provider Test Results:', responseData.test_results);
            
            return responseData;

        } catch (error) {
            console.error('❌ Provider Test Error:', error);
            throw error;
        }
    },

    // Get development status
    async getDevStatus() {
        try {
            console.log('🔓 Getting dev status');
            
            const response = await fetch(`${DEV_API_BASE_URL}/status`, {
                method: 'GET',
                headers: {
                    'X-Dev-Mode': 'true'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get dev status');
            }

            const responseData = await response.json();
            
            console.log('✅ Dev Status:', responseData);
            
            return responseData;

        } catch (error) {
            console.error('❌ Dev Status Error:', error);
            throw error;
        }
    },

    // Check if development mode is available
    async checkDevModeAvailability() {
        try {
            const response = await fetch(`${DEV_API_BASE_URL}/status`, {
                method: 'GET',
                headers: {
                    'X-Dev-Mode': 'true'
                }
            });

            return response.ok;

        } catch (error) {
            console.error('❌ Dev Mode Check Error:', error);
            return false;
        }
    }
};

// Export convenience functions
export const useDevApi = () => {
    return {
        sendMessage: devApi.sendMessage,
        detectIntent: devApi.detectIntent,
        testProviders: devApi.testProviders,
        getDevStatus: devApi.getDevStatus,
        checkAvailability: devApi.checkDevModeAvailability
    };
};
