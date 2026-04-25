from datetime import datetime
from typing import Dict, Any, List, Optional
import os
import uuid
import aiofiles
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class UploadService:
    def __init__(self):
        self.ensure_upload_directories()
    
    def ensure_upload_directories(self):
        """Ensure upload directories exist"""
        directories = [
            settings.UPLOAD_DIR,
            f"{settings.UPLOAD_DIR}/images",
            f"{settings.UPLOAD_DIR}/audio",
            f"{settings.UPLOAD_DIR}/documents"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    async def save_file(self, file_content: bytes, filename: str, file_type: str) -> Dict[str, Any]:
        """Save uploaded file to disk"""
        try:
            # Generate unique filename
            file_extension = os.path.splitext(filename)[1].lower()
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Determine file path
            file_path = os.path.join(settings.UPLOAD_DIR, file_type, unique_filename)
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(file_content)
            
            # Generate URL
            file_url = f"/api/upload/files/{file_type}/{unique_filename}"
            
            return {
                "filename": unique_filename,
                "original_filename": filename,
                "file_path": file_path,
                "file_url": file_url,
                "file_size": len(file_content),
                "file_type": file_type
            }
            
        except Exception as e:
            logger.error(f"Error saving file: {e}")
            raise
    
    async def delete_file(self, filename: str, file_type: str) -> bool:
        """Delete uploaded file"""
        try:
            file_path = os.path.join(settings.UPLOAD_DIR, file_type, filename)
            
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            return False
    
    def validate_file_type(self, filename: str, allowed_types: List[str]) -> bool:
        """Validate file type"""
        file_extension = os.path.splitext(filename)[1].lower()
        return file_extension in allowed_types
    
    def validate_file_size(self, file_size: int) -> bool:
        """Validate file size"""
        return file_size <= settings.MAX_FILE_SIZE

# Singleton instance
upload_service = UploadService()
