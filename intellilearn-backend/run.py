#!/usr/bin/env python3
"""
IntelliLearn Backend API Runner
Production-ready startup script
"""

import uvicorn
import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def main():
    """Main entry point"""
    # Environment configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))
    workers = int(os.getenv("WORKERS", 1))
    reload = os.getenv("DEBUG", "False").lower() == "true"
    
    print(f"🚀 Starting IntelliLearn Backend API")
    print(f"📍 Host: {host}")
    print(f"🌐 Port: {port}")
    print(f"👥 Workers: {workers}")
    print(f"🔄 Reload: {reload}")
    print(f"📚 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers if not reload else 1,
        reload=reload,
        log_level="info",
        access_log=True,
        use_colors=True
    )

if __name__ == "__main__":
    main()
