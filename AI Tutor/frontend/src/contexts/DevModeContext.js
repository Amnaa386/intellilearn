import React, { createContext, useContext, useState, useEffect } from 'react';

const DevModeContext = createContext();

export const useDevMode = () => {
    const context = useContext(DevModeContext);
    if (!context) {
        throw new Error('useDevMode must be used within a DevModeProvider');
    }
    return context;
};

export const DevModeProvider = ({ children }) => {
    const [isDevMode, setIsDevMode] = useState(false);
    const [authBypassed, setAuthBypassed] = useState(false);
    const [devStatus, setDevStatus] = useState(null);

    useEffect(() => {
        // Check if development mode is enabled
        const checkDevMode = async () => {
            try {
                // Check for development mode flag
                const devModeFlag = localStorage.getItem('DEV_MODE') === 'true';
                const authBypassFlag = localStorage.getItem('BYPASS_AUTH') === 'true';
                
                setIsDevMode(devModeFlag);
                setAuthBypassed(authBypassFlag);

                // Check backend dev mode status
                if (devModeFlag) {
                    await fetchDevStatus();
                }

                console.log('🔓 Development Mode:', {
                    enabled: devModeFlag,
                    authBypassed: authBypassFlag,
                    message: devModeFlag ? 'Authentication bypassed for testing' : 'Normal mode'
                });
            } catch (error) {
                console.error('Error checking dev mode:', error);
            }
        };

        checkDevMode();
    }, []);

    const fetchDevStatus = async () => {
        try {
            const response = await fetch('http://localhost:8000/dev/status');
            if (response.ok) {
                const status = await response.json();
                setDevStatus(status);
                console.log('🔓 Backend Dev Status:', status);
            }
        } catch (error) {
            console.error('Error fetching dev status:', error);
        }
    };

    const enableDevMode = () => {
        localStorage.setItem('DEV_MODE', 'true');
        localStorage.setItem('BYPASS_AUTH', 'true');
        setIsDevMode(true);
        setAuthBypassed(true);
        console.log('🔓 Development mode enabled - Authentication bypassed');
        window.location.reload();
    };

    const disableDevMode = () => {
        localStorage.removeItem('DEV_MODE');
        localStorage.removeItem('BYPASS_AUTH');
        setIsDevMode(false);
        setAuthBypassed(false);
        console.log('🔒 Development mode disabled - Authentication required');
        window.location.reload();
    };

    const value = {
        isDevMode,
        authBypassed,
        devStatus,
        enableDevMode,
        disableDevMode,
        fetchDevStatus
    };

    return (
        <DevModeContext.Provider value={value}>
            {children}
        </DevModeContext.Provider>
    );
};
