from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import uuid4
import logging
from app.core.database import get_database
from app.services.ai_service import ai_service
from app.models.notes import NotesCreate, NotesResponse, NotesCategory, NotesType

logger = logging.getLogger(__name__)

class NotesService:
    @staticmethod
    def _require_db():
        db = get_database()
        if db is None:
            raise RuntimeError("Database connection is not available")
        return db
    
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
            notes_id = str(uuid4())
            notes_doc = {
                "id": notes_id,
                "userId": user_id,
                "title": ai_notes["title"],
                "content": ai_notes["content"],
                "category": category.value,
                "type": complexity.value,
                "tags": self._generate_tags(topic, category),
                "topic": topic,
                "bookmarked": False,
                "generatedAt": datetime.utcnow()
            }
            
            db = self._require_db()
            db.collection("notes").document(notes_id).set(notes_doc)
            
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

    async def create_note(self, user_id: str, note_data: NotesCreate) -> NotesResponse:
        """Create a note from provided content (e.g. chat summary notes)."""
        try:
            notes_id = str(uuid4())
            notes_doc = {
                "id": notes_id,
                "userId": user_id,
                "title": note_data.title,
                "content": note_data.content,
                "category": note_data.category.value,
                "type": note_data.type.value,
                "tags": note_data.tags or [],
                "topic": note_data.topic,
                "bookmarked": note_data.bookmarked,
                "generatedAt": datetime.utcnow()
            }

            db = self._require_db()
            db.collection("notes").document(notes_id).set(notes_doc)

            await self._log_activity("notes_created_manual", user_id, {
                "notesId": notes_id,
                "topic": note_data.topic,
                "type": note_data.type.value
            })

            return NotesResponse(**notes_doc)
        except Exception as e:
            logger.error(f"Error creating note: {e}")
            raise
    
    async def get_user_notes(self, user_id: str, page: int = 1, limit: int = 20, 
                           category: Optional[NotesCategory] = None, bookmarked: Optional[bool] = None,
                           search: Optional[str] = None) -> Dict[str, Any]:
        """Get user's notes with filtering"""
        try:
            db = self._require_db()
            skip = (page - 1) * limit
            docs = db.collection("notes").where("userId", "==", user_id).stream()
            all_notes = []
            for doc in docs:
                note = doc.to_dict() or {}
                note["id"] = doc.id
                if category and note.get("category") != category.value:
                    continue
                if bookmarked is not None and note.get("bookmarked", False) != bookmarked:
                    continue
                if search:
                    query = search.lower()
                    haystack = f"{note.get('title','')} {note.get('content','')} {note.get('topic','')}".lower()
                    if query not in haystack:
                        continue
                all_notes.append(note)
            all_notes.sort(key=lambda x: x.get("generatedAt") or datetime.min, reverse=True)
            total = len(all_notes)
            notes = all_notes[skip:skip + limit]
            
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
            db = self._require_db()
            snapshot = db.collection("notes").document(note_id).get()
            if snapshot.exists:
                note = snapshot.to_dict() or {}
                if note.get("userId") != user_id:
                    return None
                note["id"] = note_id
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
                          if k not in ["_id", "id", "userId", "generatedAt"]}
            
            # Add updated timestamp
            update_data["updatedAt"] = datetime.utcnow()
            
            db = self._require_db()
            note_ref = db.collection("notes").document(note_id)
            snapshot = note_ref.get()
            if not snapshot.exists:
                return None
            note = snapshot.to_dict() or {}
            if note.get("userId") != user_id:
                return None
            note_ref.update(update_data)
            note = note_ref.get().to_dict() or {}
            note["id"] = note_id
            if note:
                return NotesResponse(**note)
            return None
            
        except Exception as e:
            logger.error(f"Error updating note: {e}")
            return None
    
    async def delete_note(self, user_id: str, note_id: str) -> bool:
        """Delete note"""
        try:
            db = self._require_db()
            note_ref = db.collection("notes").document(note_id)
            snapshot = note_ref.get()
            if snapshot.exists and (snapshot.to_dict() or {}).get("userId") == user_id:
                note_ref.delete()
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
            db = self._require_db()
            note_ref = db.collection("notes").document(note_id)
            snapshot = note_ref.get()
            if not snapshot.exists:
                return None
            note = snapshot.to_dict() or {}
            if note.get("userId") != user_id:
                return None
            
            new_bookmark_status = not note.get("bookmarked", False)
            
            note_ref.update({"bookmarked": new_bookmark_status})
            
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
            db = self._require_db()
            notes = []
            for doc in db.collection("notes").where("userId", "==", user_id).stream():
                notes.append(doc.to_dict() or {})
            if notes:
                categories = sorted({n.get("category", "general") for n in notes})
                last_generated = max((n.get("generatedAt") for n in notes if n.get("generatedAt")), default=None)
                return {
                    "totalNotes": len(notes),
                    "bookmarkedNotes": sum(1 for n in notes if n.get("bookmarked")),
                    "categories": categories,
                    "lastGenerated": last_generated
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
            result = await self.get_user_notes(user_id, page, limit, search=query)
            
            return {
                "notes": result["notes"],
                "total": result["total"],
                "page": result["page"],
                "limit": result["limit"],
                "totalPages": result["totalPages"],
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
            db = self._require_db()
            activity_doc = {
                "id": str(uuid4()),
                "userId": user_id,
                "action": action,
                "details": metadata or {},
                "timestamp": datetime.utcnow()
            }
            db.collection("activity_logs").document(activity_doc["id"]).set(activity_doc)
        except Exception as e:
            logger.error(f"Error logging activity: {e}")

# Singleton instance
notes_service = NotesService()
