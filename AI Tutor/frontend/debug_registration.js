/**
 * Frontend Registration Debug Script
 * 
 * This script helps debug registration issues by testing the frontend
 * and identifying problems with API calls, error handling, and UI issues.
 */

// Configuration
const API_BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';

// Test cases
const testCases = [
    {
        name: 'Valid Registration',
        description: 'Test successful user registration',
        data: {
            email: 'testuser@example.com',
            username: 'testuser123',
            password: 'testpass123',
            confirmPassword: 'testpass123'
        },
        expectedStatus: 200,
        expectedError: null
    },
    {
        name: 'Duplicate Email',
        description: 'Test registration with existing email',
        data: {
            email: 'testuser@example.com', // This should exist after first test
            username: 'differentuser456',
            password: 'testpass123',
            confirmPassword: 'testpass123'
        },
        expectedStatus: 409,
        expectedError: 'Email already registered'
    },
    {
        name: 'Duplicate Username',
        description: 'Test registration with existing username',
        data: {
            email: 'newuser@example.com',
            username: 'testuser123', // This should exist after first test
            password: 'testpass123',
            confirmPassword: 'testpass123'
        },
        expectedStatus: 409,
        expectedError: 'Username already taken'
    },
    {
        name: 'Invalid Email Format',
        description: 'Test with invalid email format',
        data: {
            email: 'invalid-email',
            username: 'testuser789',
            password: 'testpass123',
            confirmPassword: 'testpass123'
        },
        expectedStatus: 422,
        expectedError: 'Invalid email format'
    },
    {
        name: 'Password Mismatch',
        description: 'Test with password confirmation mismatch',
        data: {
            email: 'testuser@example.com',
            username: 'testuser789',
            password: 'testpass123',
            confirmPassword: 'differentpass123'
        },
        expectedStatus: 422,
        expectedError: 'Passwords do not match'
    },
    {
        name: 'Missing Fields',
        description: 'Test with missing required fields',
        data: {
            email: 'testuser@example.com',
            // Missing username
            password: 'testpass123',
            confirmPassword: 'testpass123'
        },
        expectedStatus: 422,
        expectedError: 'Username is required'
    },
    {
        name: 'Weak Password',
        description: 'Test with weak password',
        data: {
            email: 'testuser@example.com',
            username: 'testuser789',
            password: '123',
            confirmPassword: '123'
        },
        expectedStatus: 422,
        expectedError: 'Password must be at least 6 characters long'
    },
    {
        name: 'Network Error',
        description: 'Test with server unreachable',
        data: {
            email: 'testuser@example.com',
            username: 'testuser789',
            password: 'testpass123',
            confirmPassword: 'testpass123'
        },
        expectedStatus: 500,
        expectedError: 'Network error'
    }
];

// Main testing function
async function runRegistrationTests() {
    console.log('🔍 Starting Frontend Registration Debug Tests...\n');
    
    const results = [];
    
    for (const testCase of testCases) {
        console.log(`\n📋 Testing: ${testCase.name}`);
        console.log(`📝 Description: ${testCase.description}`);
        
        try {
            const result = await testRegistration(testCase);
            results.push(result);
            
            if (result.success) {
                console.log(`✅ ${testCase.name}: PASSED`);
                console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
            } else {
                console.log(`❌ ${testCase.name}: FAILED`);
                console.log(`   Error: ${result.error}`);
                console.log(`   Status: ${result.status}`);
                console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
            }
        } catch (error) {
            console.log(`💥 ${testCase.name}: ERROR - ${error.message}`);
            results.push({
                name: testCase.name,
                success: false,
                error: error.message,
                status: 'TEST_ERROR'
            });
        }
    }
    
    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('📊 REGISTRATION DEBUG REPORT');
    console.log('='.repeat(60));
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    
    console.log('\n📋 Detailed Results:');
    results.forEach(result => {
        const status = result.success ? 'PASS' : 'FAIL';
        const symbol = result.success ? '✅' : '❌';
        console.log(`   ${symbol} ${result.name}: ${status}`);
        
        if (!result.success) {
            console.log(`      Error: ${result.error}`);
            if (result.suggestions) {
                console.log(`      Suggestions: ${result.suggestions.join(', ')}`);
            }
        }
    });
    
    // Save report to file
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: parseFloat(successRate)
        },
        results: results,
        environment: {
            frontend: FRONTEND_URL,
            backend: API_BASE_URL,
            userAgent: navigator.userAgent
        }
    };
    
    // In browser, save to localStorage or download file
    try {
        localStorage.setItem('registrationDebugReport', JSON.stringify(reportData, null, 2));
        console.log('\n💾 Report saved to localStorage as "registrationDebugReport"');
        
        // Also create downloadable file
        const dataStr = JSON.stringify(reportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'registration_debug_report.json';
        a.click();
        console.log('\n💾 Report downloaded as "registration_debug_report.json"');
    } catch (error) {
        console.log('⚠️ Could not save report file:', error.message);
    }
}

// Test individual registration
async function testRegistration(testCase) {
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': FRONTEND_URL
            },
            body: JSON.stringify(testCase.data)
        });
        
        const responseTime = Date.now() - startTime;
        const status = response.status;
        
        let responseData;
        try {
            responseData = await response.json();
        } catch (e) {
            responseData = { error: 'Invalid JSON response' };
        }
        
        // Analyze response
        const result = {
            name: testCase.name,
            success: status === testCase.expectedStatus,
            status: status,
            responseTime: responseTime,
            response: responseData,
            error: null
        };
        
        // Check for errors
        if (status !== testCase.expectedStatus) {
            if (responseData.detail) {
                result.error = responseData.detail;
            } else if (responseData.error) {
                result.error = responseData.error;
            } else {
                result.error = `Unexpected status ${status}`;
            }
            
            // Add suggestions based on error
            result.suggestions = getSuggestions(testCase.name, responseData.detail);
        }
        
        return result;
    } catch (error) {
        return {
            name: testCase.name,
            success: false,
            error: error.message,
            status: 0,
            responseTime: Date.now() - startTime,
            response: { error: error.message }
        };
    }
}

// Get suggestions based on error type
function getSuggestions(testName, errorDetail) {
    const suggestions = [];
    
    if (errorDetail && errorDetail.toLowerCase) {
        if (errorDetail.includes('already registered') || errorDetail.includes('already exists')) {
            suggestions.push('Try logging in with your existing account');
            suggestions.push('Use a different email address');
            suggestions.push('Use password recovery if you have an account');
        } else if (errorDetail.includes('already taken')) {
            suggestions.push('Try a different username');
            suggestions.push('Add numbers or underscores to make it unique');
            suggestions.push('Use your email address as username');
        } else if (errorDetail.includes('invalid') && errorDetail.includes('email')) {
            suggestions.push('Check email format (e.g., user@example.com)');
            suggestions.push('Ensure no typos in email address');
        } else if (errorDetail.includes('password')) {
            suggestions.push('Use at least 6 characters');
            suggestions.push('Include both letters and numbers');
            suggestions.push('Add special characters for stronger password');
        } else if (errorDetail.includes('network') || errorDetail.includes('connection')) {
            suggestions.push('Check your internet connection');
            suggestions.push('Verify backend server is running');
            suggestions.push('Try again in a few moments');
        }
    }
    
    return suggestions;
}

// Network connectivity test
async function testConnectivity() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        console.error('Backend connectivity test failed:', error);
        return false;
    }
}

// Browser compatibility check
function checkBrowserCompatibility() {
    const issues = [];
    
    // Check fetch API support
    if (!window.fetch) {
        issues.push('Browser does not support fetch API');
    }
    
    // Check JSON support
    try {
        JSON.parse('{}');
    } catch (e) {
        issues.push('JSON parsing not supported');
    }
    
    // Check CORS support
    if (!window.XMLHttpRequest) {
        issues.push('XMLHttpRequest not supported');
    }
    
    if (issues.length > 0) {
        console.warn('Browser Compatibility Issues:');
        issues.forEach(issue => console.warn(`  - ${issue}`));
    }
    
    return issues.length === 0;
}

// Main execution
console.log('🌐 Frontend Registration Debug Script');
console.log('🔧 Testing browser compatibility...');
checkBrowserCompatibility();

console.log('🌐 Testing backend connectivity...');
testConnectivity().then(isConnected => {
    if (isConnected) {
        console.log('✅ Backend is reachable');
        runRegistrationTests();
    } else {
        console.error('❌ Backend is not reachable');
        console.log('Please ensure the backend server is running on http://localhost:8000');
    }
}).catch(error => {
    console.error('❌ Connectivity test failed:', error);
});

// Export for use in browser console
window.debugRegistration = {
    runTests: runRegistrationTests,
    testCases: testCases,
    testConnectivity: testConnectivity
};
