from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from bson import ObjectId
import logging
from app.core.database import get_database
from app.core.redis import set_cache, get_cache, delete_cache
from app.services.ai_service import ai_service
from app.models.notes import NotesCreate, NotesResponse, NotesCategory, NotesType

logger = logging.getLogger(__name__)

class NotesService:
    def __init__(self):
        self.db = get_database()
    
    async def generate_notes(self, user_id: str, topic: str, complexity: NotesType = NotesType.SIMPLE, 
                           include_questions: bool = True, category: Optional[NotesCategory] = None) -> NotesResponse:
        """Generate AI study notes"""
        try:
            # Auto-detect category if not provided
            if not category:
                category = self._detect_category(topic)
            
            # Generate notes using AI
            ai_notes = await ai_service.generate_notes(topic, complexity.value, include_questions)
            
            # Create notes document
            notes_id = str(ObjectId())
            notes_doc = {
                "_id": notes_id,
                "userId": user_id,
                "title": ai_notes["title"],
                "content": ai_notes["content"],
                "category": category,
                "type": complexity,
                "tags": self._generate_tags(topic, category),
                "topic": topic,
                "bookmarked": False,
                "generatedAt": datetime.utcnow()
            }
            
            await self.db.notes.insert_one(notes_doc)
            
            # Log activity
            await self._log_activity("notes_generated", user_id, {
                "notesId": notes_id,
                "topic": topic,
                "type": complexity.value
            })
            
            return NotesResponse(**notes_doc)
            
        except Exception as e:
            logger.error(f"Error generating notes: {e}")
            raise
    
    async def get_user_notes(self, user_id: str, page: int = 1, limit: int = 20, 
                           category: Optional[NotesCategory] = None, bookmarked: Optional[bool] = None,
                           search: Optional[str] = None) -> Dict[str, Any]:
        """Get user's notes with filtering"""
        try:
            skip = (page - 1) * limit
            
            # Build filter
            filter_dict = {"userId": user_id}
            
            if category:
                filter_dict["category"] = category
            if bookmarked is not None:
                filter_dict["bookmarked"] = bookmarked
            if search:
                filter_dict["$text"] = {"$search": search}
            
            # Get notes
            notes = await self.db.notes.find(
                filter_dict
            ).sort("generatedAt", -1).skip(skip).limit(limit).to_list(length=limit)
            
            # Get total count
            total = await self.db.notes.count_documents(filter_dict)
            
            return {
                "notes": [NotesResponse(**note) for note in notes],
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": (total + limit - 1) // limit
            }
            
        except Exception as e:
            logger.error(f"Error getting user notes: {e}")
            return {"notes": [], "total": 0, "page": page, "limit": limit, "totalPages": 0}
    
    async def get_note_by_id(self, user_id: str, note_id: str) -> Optional[NotesResponse]:
        """Get specific note by ID"""
        try:
            note = await self.db.notes.find_one({
                "_id": note_id,
                "userId": user_id
            })
            
            if note:
                return NotesResponse(**note)
            return None
            
        except Exception as e:
            logger.error(f"Error getting note by ID: {e}")
            return None
    
    async def update_note(self, user_id: str, note_id: str, update_data: Dict[str, Any]) -> Optional[NotesResponse]:
        """Update note"""
        try:
            # Remove sensitive fields
            update_data = {k: v for k, v in update_data.items() 
                          if k not in ["_id", "userId", "generatedAt"]}
            
            # Add updated timestamp
            update_data["updatedAt"] = datetime.utcnow()
            
            # Update note
            result = await self.db.notes.update_one(
                {"_id": note_id, "userId": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                return None
            
            # Get updated note
            note = await self.db.notes.find_one({"_id": note_id, "userId": user_id})
            if note:
                return NotesResponse(**note)
            return None
            
        except Exception as e:
            logger.error(f"Error updating note: {e}")
            return None
    
    async def delete_note(self, user_id: str, note_id: str) -> bool:
        """Delete note"""
        try:
            result = await self.db.notes.delete_one({
                "_id": note_id,
                "userId": user_id
            })
            
            if result.deleted_count > 0:
                # Log activity
                await self._log_activity("notes_deleted", user_id, {
                    "notesId": note_id
                })
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting note: {e}")
            return False
    
    async def toggle_bookmark(self, user_id: str, note_id: str) -> Optional[bool]:
        """Toggle note bookmark status"""
        try:
            note = await self.db.notes.find_one({
                "_id": note_id,
                "userId": user_id
            })
            
            if not note:
                return None
            
            new_bookmark_status = not note.get("bookmarked", False)
            
            await self.db.notes.update_one(
                {"_id": note_id, "userId": user_id},
                {"$set": {"bookmarked": new_bookmark_status}}
            )
            
            # Log activity
            await self._log_activity("notes_bookmarked", user_id, {
                "notesId": note_id,
                "bookmarked": new_bookmark_status
            })
            
            return new_bookmark_status
            
        except Exception as e:
            logger.error(f"Error toggling bookmark: {e}")
            return None
    
    async def get_bookmarked_notes(self, user_id: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Get user's bookmarked notes"""
        return await self.get_user_notes(user_id, page, limit, bookmarked=True)
    
    async def get_notes_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user's notes statistics"""
        try:
            pipeline = [
                {"$match": {"userId": user_id}},
                {
                    "$group": {
                        "_id": None,
                        "totalNotes": {"$sum": 1},
                        "bookmarkedNotes": {"$sum": {"$cond": [{"$eq": ["$bookmarked", True]}, 1, 0]}},
                        "categories": {"$addToSet": "$category"},
                        "lastGenerated": {"$max": "$generatedAt"}
                    }
                }
            ]
            
            stats = await self.db.notes.aggregate(pipeline).to_list(length=1)
            
            if stats:
                stat = stats[0]
                return {
                    "totalNotes": stat["totalNotes"],
                    "bookmarkedNotes": stat["bookmarkedNotes"],
                    "categories": stat["categories"],
                    "lastGenerated": stat["lastGenerated"]
                }
            else:
                return {
                    "totalNotes": 0,
                    "bookmarkedNotes": 0,
                    "categories": [],
                    "lastGenerated": None
                }
                
        except Exception as e:
            logger.error(f"Error getting notes stats: {e}")
            return {}
    
    async def search_notes(self, user_id: str, query: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Search notes by text"""
        try:
            skip = (page - 1) * limit
            
            # Text search
            notes = await self.db.notes.find(
                {
                    "userId": user_id,
                    "$text": {"$search": query}
                },
                {"score": {"$meta": "textScore"}}
            ).sort("score", {"$meta": "textScore"}).skip(skip).limit(limit).to_list(length=limit)
            
            # Get total count
            total = await self.db.notes.count_documents({
                "userId": user_id,
                "$text": {"$search": query}
            })
            
            return {
                "notes": [NotesResponse(**note) for note in notes],
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": (total + limit - 1) // limit,
                "query": query
            }
            
        except Exception as e:
            logger.error(f"Error searching notes: {e}")
            return {"notes": [], "total": 0, "page": page, "limit": limit, "totalPages": 0, "query": query}
    
    def _detect_category(self, topic: str) -> NotesCategory:
        """Auto-detect notes category based on topic"""
        topic_lower = topic.lower()
        
        category_keywords = {
            NotesCategory.SCIENCE: ['biology', 'chemistry', 'physics', 'science', 'experiment', 'research', 'laboratory'],
            NotesCategory.MATHEMATICS: ['math', 'mathematics', 'algebra', 'geometry', 'calculus', 'statistics', 'equation', 'formula'],
            NotesCategory.HISTORY: ['history', 'historical', 'ancient', 'medieval', 'modern', 'war', 'civilization', 'revolution'],
            NotesCategory.LITERATURE: ['literature', 'poetry', 'novel', 'story', 'author', 'writing', 'book', 'text'],
            NotesCategory.TECHNOLOGY: ['computer', 'programming', 'software', 'technology', 'digital', 'internet', 'code', 'algorithm'],
            NotesCategory.BUSINESS: ['business', 'economics', 'finance', 'marketing', 'management', 'entrepreneurship', 'investment']
        }
        
        # Find best matching category
        best_category = NotesCategory.GENERAL
        max_matches = 0
        
        for category, keywords in category_keywords.items():
            matches = sum(1 for keyword in keywords if keyword in topic_lower)
            if matches > max_matches:
                max_matches = matches
                best_category = category
        
        return best_category
    
    def _generate_tags(self, topic: str, category: NotesCategory) -> List[str]:
        """Generate tags for notes"""
        tags = [category.value, "AI-Generated"]
        
        # Add topic-based tags
        topic_words = topic.lower().split()
        for word in topic_words:
            if len(word) > 3:  # Only include meaningful words
                tags.append(word.capitalize())
        
        # Add study-related tags
        tags.extend(["Study", "Academic"])
        
        return list(set(tags))  # Remove duplicates
    
    async def _log_activity(self, action: str, user_id: str, metadata: Optional[Dict[str, Any]] = None):
        """Log notes activity"""
        try:
            activity_doc = {
                "userId": user_id,
                "action": action,
                "details": metadata or {},
                "timestamp": datetime.utcnow()
            }
            await self.db.activity_logs.insert_one(activity_doc)
        except Exception as e:
            logger.error(f"Error logging activity: {e}")

# Singleton instance
notes_service = NotesService()
