import React from 'react';
import { useDevMode } from '../contexts/DevModeContext';

const DevModeToggle = () => {
    const { isDevMode, authBypassed, devStatus, enableDevMode, disableDevMode } = useDevMode();

    return (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-4">
                <div className="text-sm">
                    <span className={`font-semibold ${isDevMode ? 'text-green-600' : 'text-gray-600'}`}>
                        {isDevMode ? '🔓 Dev Mode' : '🔒 Normal Mode'}
                    </span>
                    {authBypassed && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Auth Bypassed
                        </span>
                    )}
                </div>
                
                <div className="flex space-x-2">
                    {!isDevMode ? (
                        <button
                            onClick={enableDevMode}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                            Enable Dev Mode
                        </button>
                    ) : (
                        <button
                            onClick={disableDevMode}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            Disable Dev Mode
                        </button>
                    )}
                </div>
            </div>
            
            {devStatus && (
                <div className="mt-4 text-xs text-gray-600 border-t pt-2">
                    <div className="font-semibold mb-2">Backend Status:</div>
                    <div>Mode: {devStatus.dev_mode_enabled ? 'Enabled' : 'Disabled'}</div>
                    <div>Auth: {devStatus.auth_bypassed ? 'Bypassed' : 'Required'}</div>
                    <div>Mock User: {devStatus.mock_user?.email}</div>
                    <div>Endpoints:</div>
                    <ul className="ml-4">
                        {devStatus.available_endpoints?.map((endpoint, index) => (
                            <li key={index} className="text-blue-600">{endpoint}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default DevModeToggle;
