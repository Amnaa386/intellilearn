# Authentication Bypass Guide for AI Chat Testing

## Overview

This guide explains how to temporarily disable authentication to test AI chat functionality independently of the authentication system. The bypass system allows you to test Groq, Gemini, and DeepSeek AI integrations without requiring user login/signup.

## Quick Start

### Enable Development Mode

#### Backend Setup

1. **Copy development environment file:**
```bash
cd backend
cp .env.dev .env
```

2. **Update API keys in .env:**
```env
# AI API Keys
GROQ_API_KEY=your_actual_groq_key
GEMINI_API_KEY=your_actual_gemini_key
DEEPSEEK_API_KEY=your_actual_deepseek_key

# Development Mode Settings
DEV_MODE=true
BYPASS_AUTH=true
```

3. **Start backend server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

1. **Start frontend server:**
```bash
cd frontend
npm start
```

2. **Enable development mode in browser:**
   - Open the application
   - Click "Enable Dev Mode" button in the top-right corner
   - The chat interface will now work without authentication

## Development Mode Features

### Available Endpoints

| Endpoint | Authentication Required | Description |
|----------|-------------------------|-------------|
| `/dev/chat` | **No** | AI chat without authentication |
| `/dev/detect-intent` | **No** | Intent detection testing |
| `/dev/status` | **No** | Development mode status |
| `/dev/test-ai-providers` | **No** | Test all AI providers |

### Frontend Components

#### DevModeToggle
- **Location**: Top-right corner of the screen
- **Function**: Enable/disable development mode
- **Visual Indicators**: 
  - Green badge when enabled
  - "Auth Bypassed" indicator
  - Backend status display

#### Chat Interface
- **Immediate Access**: Chat input works on page load
- **No Login Required**: Bypasses all authentication checks
- **Full AI Functionality**: All AI providers available

## Technical Implementation

### Backend Components

#### 1. Development Mode Configuration (`dev_mode.py`)
```python
@dataclass
class DevModeConfig:
    enabled: bool = False
    bypass_auth: bool = False
    mock_user_id: Optional[int] = 1
    mock_user_email: str = "dev@test.com"
    mock_user_username: str = "dev_user"
    log_bypass_attempts: bool = True
```

#### 2. Authentication Bypass Utilities (`bypass_auth.py`)
```python
def should_bypass_auth() -> bool:
    """Check if authentication should be bypassed"""
    return dev_mode.enabled and dev_mode.bypass_auth

def get_mock_user():
    """Get mock user for development"""
    return User(
        id=dev_mode.mock_user_id,
        email=dev_mode.mock_user_email,
        username=dev_mode.mock_user_username,
        is_active=True
    )
```

#### 3. Development Chat API (`dev_chat_api.py`)
```python
@router.post("/chat", response_model=DevChatResponse)
async def dev_chat_endpoint(request: DevChatRequest):
    """Development chat endpoint with no authentication required"""
    log_auth_bypass("dev_chat", "Development chat endpoint accessed without authentication")
    # ... AI processing logic
```

### Frontend Components

#### 1. DevModeContext
```javascript
const DevModeProvider = ({ children }) => {
    const [isDevMode, setIsDevMode] = useState(false);
    const [authBypassed, setAuthBypassed] = useState(false);
    
    const enableDevMode = () => {
        localStorage.setItem('DEV_MODE', 'true');
        localStorage.setItem('BYPASS_AUTH', 'true');
        setIsDevMode(true);
        setAuthBypassed(true);
    };
};
```

#### 2. Development API Client (`devApi.js`)
```javascript
export const devApi = {
    async sendMessage(messages, userQuery, context = null, sessionId = null) {
        const response = await fetch(`${DEV_API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Dev-Mode': 'true'
            },
            body: JSON.stringify(requestData)
        });
        return response.json();
    }
};
```

#### 3. Chat Context Integration
```javascript
const sendMessage = async (message, sessionId = null) => {
    try {
        let response;
        
        // Use dev API if auth is bypassed, otherwise use normal API
        if (authBypassed) {
            console.log('Using dev API (auth bypassed)');
            response = await devApi.sendMessage(messages, message, null, sessionId);
        } else {
            console.log('Using normal API (auth required)');
            response = await axios.post('/chat', { message, session_id: sessionId });
        }
        
        return response;
    } catch (error) {
        console.error('Failed to send message:', error);
        return null;
    }
};
```

## Testing AI Functionality

### Test Scenarios

#### 1. Basic Chat Testing
```javascript
// Test different query types
const testQueries = [
    "Explain photosynthesis",
    "Create study notes on World War II",
    "Generate a math quiz",
    "Compare Python and JavaScript",
    "Solve this equation: 2x + 5 = 15"
];
```

#### 2. Provider Testing
```bash
# Test all AI providers
curl -X GET "http://localhost:8000/dev/test-ai-providers" \
  -H "X-Dev-Mode: true"
```

#### 3. Intent Detection Testing
```bash
curl -X POST "http://localhost:8000/dev/detect-intent?query=Explain%20quantum%20physics" \
  -H "X-Dev-Mode: true"
```

### Response Analysis

#### Development API Response Format
```json
{
  "response": "AI response content",
  "content_type": "explanation",
  "intent_detected": "explanation",
  "confidence_score": 0.85,
  "provider_used": "groq",
  "response_time": 1.2,
  "structured_data": {},
  "metadata": {
    "intent_confidence": 0.85,
    "complexity_score": 0.6,
    "keywords_found": ["explain", "quantum", "physics"],
    "reasoning": "High confidence based on keyword matching",
    "token_usage": {"prompt_tokens": 50, "completion_tokens": 150},
    "dev_mode": true,
    "auth_bypassed": true
  }
}
```

## Environment Variables

### Development Mode Settings
```env
# Enable development mode
DEV_MODE=true

# Bypass authentication for testing
BYPASS_AUTH=true

# Mock user data for development
MOCK_USER_ID=1
MOCK_USER_EMAIL=dev@test.com
MOCK_USER_USERNAME=dev_user

# Log authentication bypass attempts
LOG_BYPASS=true
```

### AI API Keys
```env
# Required for AI functionality
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

## Security Considerations

### Development Mode Only
- **Never enable in production**: Development mode bypasses all security
- **Local testing only**: Should only be used in development environments
- **API key protection**: Ensure API keys are properly secured

### Logging and Monitoring
```python
def log_auth_bypass(endpoint: str, reason: str = "Development mode"):
    """Log authentication bypass attempts"""
    if dev_mode.log_bypass_attempts:
        logger.info(f"AUTH BYPASS - Endpoint: {endpoint}, Reason: {reason}")
```

## Troubleshooting

### Common Issues

#### 1. Development Mode Not Working
**Symptoms**: Chat still requires authentication
**Solutions**:
- Check `.env` file has `DEV_MODE=true` and `BYPASS_AUTH=true`
- Restart backend server after changing environment variables
- Click "Enable Dev Mode" button in frontend

#### 2. AI Providers Not Responding
**Symptoms**: Chat returns errors or no response
**Solutions**:
- Verify API keys are correct in `.env`
- Check API key quotas and limits
- Test individual providers: `GET /dev/test-ai-providers`

#### 3. Frontend Not Using Dev API
**Symptoms**: Still trying to use authenticated endpoints
**Solutions**:
- Clear browser localStorage: `localStorage.clear()`
- Refresh page after enabling dev mode
- Check browser console for dev mode status

### Debug Commands

#### Backend Status Check
```bash
curl "http://localhost:8000/dev/status"
```

#### Frontend Dev Mode Check
```javascript
// In browser console
console.log('Dev Mode:', localStorage.getItem('DEV_MODE'));
console.log('Auth Bypassed:', localStorage.getItem('BYPASS_AUTH'));
```

## Re-enabling Authentication

### Disable Development Mode

#### Backend
```env
# Set in .env
DEV_MODE=false
BYPASS_AUTH=false
```

#### Frontend
- Click "Disable Dev Mode" button in the UI
- Or clear localStorage: `localStorage.clear()`

### Verify Normal Operation
```bash
# Check that dev endpoints are disabled
curl "http://localhost:8000/dev/status"
# Should return error or be inaccessible
```

## File Structure

### Backend Files
```
backend/app/
    dev_mode.py              # Development mode configuration
    bypass_auth.py           # Authentication bypass utilities
    dev_chat_api.py          # Development chat endpoints
    main.py                  # Updated to include dev endpoints
    .env.dev                 # Development environment template
```

### Frontend Files
```
frontend/src/
    contexts/DevModeContext.js    # Development mode state management
    components/DevModeToggle.js   # Development mode UI toggle
    utils/devApi.js               # Development API client
    App.js                        # Updated to include DevModeProvider
    pages/Chat.js                 # Updated to bypass auth checks
    contexts/ChatContext.js       # Updated to use dev API
```

## Best Practices

### Development Workflow
1. **Enable dev mode** for AI testing
2. **Test all AI providers** individually
3. **Test different query types** and intents
4. **Verify error handling** and fallbacks
5. **Disable dev mode** before deploying

### Code Organization
- **Keep auth code intact**: All authentication logic is preserved
- **Use conditional logic**: `if authBypassed` checks throughout the codebase
- **Clean separation**: Dev endpoints are separate from production endpoints
- **Easy reversion**: Simple environment variable changes to disable

## Conclusion

The authentication bypass system provides a clean, reversible way to test AI functionality without authentication requirements. All original authentication code remains intact and can be easily re-enabled by setting environment variables or using the UI toggle.

This system allows for:
- **Immediate AI testing** without setup overhead
- **Provider isolation** for individual testing
- **Comprehensive debugging** with detailed logging
- **Easy reversion** to normal operation
- **Production safety** with clear separation from production code
