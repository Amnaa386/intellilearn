/**
 * Authentication Configuration
 * Control authentication behavior with simple flags
 */

// Set to false to disable authentication for testing
export const AUTH_ENABLED = false;

// Development mode settings
export const DEV_MODE = {
  enabled: true,
  bypassAuth: true,
  showLoginPrompt: false,
};

// Test mode - allows all AI features without login
export const TEST_MODE = {
  enabled: true,
  allowChatWithoutAuth: true,
  allowAllFeatures: true,
};
