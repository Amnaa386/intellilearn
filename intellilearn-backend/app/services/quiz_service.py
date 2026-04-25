from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from bson import ObjectId
import logging
from app.core.database import get_database
from app.core.redis import set_cache, get_cache, delete_cache
from app.services.ai_service import ai_service
from app.models.quiz import Question, QuizResponse, QuestionType, Difficulty, QuizSource

logger = logging.getLogger(__name__)

class QuizService:
    def __init__(self):
        self.db = get_database()
    
    async def generate_quiz(self, user_id: str, source: QuizSource = QuizSource.TOPIC, 
                           topic: Optional[str] = None, session_id: Optional[str] = None,
                           note_id: Optional[str] = None, question_count: int = 5,
                           difficulty: Difficulty = Difficulty.MEDIUM,
                           question_types: List[QuestionType] = [QuestionType.MCQ]) -> QuizResponse:
        """Generate AI quiz questions"""
        try:
            # Validate source parameters
            if source == QuizSource.TOPIC and not topic:
                raise ValueError("Topic is required for topic-based quiz")
            if source == QuizSource.CHAT and not session_id:
                raise ValueError("Session ID is required for chat-based quiz")
            if source == QuizSource.NOTES and not note_id:
                raise ValueError("Note ID is required for notes-based quiz")
            
            # Get content for quiz generation
            content = await self._get_quiz_content(source, topic, session_id, note_id, user_id)
            
            # Generate quiz using AI
            ai_quiz = await ai_service.generate_quiz(
                content["topic"],
                question_count,
                difficulty.value,
                [qt.value for qt in question_types]
            )
            
            # Create quiz document
            quiz_id = str(ObjectId())
            quiz_doc = {
                "_id": quiz_id,
                "userId": user_id,
                "title": ai_quiz["title"],
                "source": source,
                "sourceId": content.get("sourceId"),
                "questions": ai_quiz["questions"],
                "createdAt": datetime.utcnow(),
                "completedAt": None,
                "score": None,
                "maxScore": len(ai_quiz["questions"]) * 10  # 10 points per question
            }
            
            await self.db.quizzes.insert_one(quiz_doc)
            
            # Log activity
            await self._log_activity("quiz_generated", user_id, {
                "quizId": quiz_id,
                "source": source.value,
                "questionCount": len(ai_quiz["questions"])
            })
            
            return QuizResponse(**quiz_doc)
            
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            raise
    
    async def generate_quiz_from_chat(self, user_id: str, session_id: str, mode: str = "mcq") -> QuizResponse:
        """Generate quiz from chat session (specialized)"""
        try:
            # Get chat session content
            session = await self.db.chat_sessions.find_one({
                "_id": session_id,
                "userId": user_id
            })
            
            if not session:
                raise ValueError("Chat session not found")
            
            # Get recent messages for context
            messages = await self.db.messages.find(
                {"sessionId": session_id}
            ).sort("timestamp", -1).limit(20).to_list(length=20)
            
            # Extract content from messages
            content_text = " ".join([msg["content"] for msg in messages if msg["type"] == "user"])
            
            # Generate quiz
            question_types = [QuestionType.MCQ] if mode == "mcq" else [QuestionType.WRITTEN]
            
            return await self.generate_quiz(
                user_id=user_id,
                source=QuizSource.CHAT,
                session_id=session_id,
                question_count=6,
                difficulty=Difficulty.MEDIUM,
                question_types=question_types
            )
            
        except Exception as e:
            logger.error(f"Error generating quiz from chat: {e}")
            raise
    
    async def get_quiz_by_id(self, user_id: str, quiz_id: str) -> Optional[QuizResponse]:
        """Get specific quiz by ID"""
        try:
            quiz = await self.db.quizzes.find_one({
                "_id": quiz_id,
                "userId": user_id
            })
            
            if quiz:
                return QuizResponse(**quiz)
            return None
            
        except Exception as e:
            logger.error(f"Error getting quiz by ID: {e}")
            return None
    
    async def get_user_quizzes(self, user_id: str, page: int = 1, limit: int = 20, 
                              completed: Optional[bool] = None) -> Dict[str, Any]:
        """Get user's quizzes with filtering"""
        try:
            skip = (page - 1) * limit
            
            # Build filter
            filter_dict = {"userId": user_id}
            
            if completed is not None:
                filter_dict["completedAt"] = {"$exists": completed}
            
            # Get quizzes
            quizzes = await self.db.quizzes.find(
                filter_dict
            ).sort("createdAt", -1).skip(skip).limit(limit).to_list(length=limit)
            
            # Get total count
            total = await self.db.quizzes.count_documents(filter_dict)
            
            return {
                "quizzes": [QuizResponse(**quiz) for quiz in quizzes],
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": (total + limit - 1) // limit
            }
            
        except Exception as e:
            logger.error(f"Error getting user quizzes: {e}")
            return {"quizzes": [], "total": 0, "page": page, "limit": limit, "totalPages": 0}
    
    async def submit_quiz(self, user_id: str, quiz_id: str, answers: Dict[str, Any], 
                         written_answers: Optional[Dict[str, Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Submit quiz answers and calculate score"""
        try:
            # Get quiz
            quiz = await self.db.quizzes.find_one({
                "_id": quiz_id,
                "userId": user_id
            })
            
            if not quiz:
                raise ValueError("Quiz not found")
            
            if quiz.get("completedAt"):
                raise ValueError("Quiz already completed")
            
            # Calculate score
            score_result = await self._calculate_score(quiz["questions"], answers, written_answers)
            
            # Update quiz
            await self.db.quizzes.update_one(
                {"_id": quiz_id},
                {
                    "$set": {
                        "completedAt": datetime.utcnow(),
                        "score": score_result["score"],
                        "answers": answers,
                        "writtenAnswers": written_answers or {},
                        "timeSpent": score_result.get("timeSpent", 0)
                    }
                }
            )
            
            # Generate feedback
            feedback = await self._generate_feedback(score_result["score"], quiz["maxScore"])
            
            # Log activity
            await self._log_activity("quiz_completed", user_id, {
                "quizId": quiz_id,
                "score": score_result["score"],
                "maxScore": quiz["maxScore"]
            })
            
            return {
                "quizId": quiz_id,
                "score": score_result["score"],
                "maxScore": quiz["maxScore"],
                "percentage": (score_result["score"] / quiz["maxScore"]) * 100,
                "passed": score_result["score"] >= (quiz["maxScore"] * 0.6),  # 60% passing
                "questionResults": score_result["questionResults"],
                "feedback": feedback["message"],
                "suggestions": feedback["suggestions"]
            }
            
        except Exception as e:
            logger.error(f"Error submitting quiz: {e}")
            raise
    
    async def evaluate_written_answer(self, user_id: str, quiz_id: str, question_id: str, answer: str) -> Dict[str, Any]:
        """Evaluate written answer using AI"""
        try:
            # Get quiz and question
            quiz = await self.db.quizzes.find_one({
                "_id": quiz_id,
                "userId": user_id
            })
            
            if not quiz:
                raise ValueError("Quiz not found")
            
            # Find the question
            question = None
            for q in quiz["questions"]:
                if q["id"] == question_id:
                    question = q
                    break
            
            if not question or question["type"] != "written":
                raise ValueError("Question not found or not a written question")
            
            # Evaluate using AI
            evaluation = await ai_service.evaluate_written_answer(
                question["question"],
                answer,
                question.get("modelAnswer")
            )
            
            return {
                "questionId": question_id,
                "quality": evaluation["quality"],
                "feedback": evaluation.get("feedback", []),
                "highlights": evaluation.get("highlights", []),
                "meetsLength": evaluation.get("meetsLength", True),
                "suggestions": evaluation.get("suggestions", [])
            }
            
        except Exception as e:
            logger.error(f"Error evaluating written answer: {e}")
            raise
    
    async def get_hint(self, user_id: str, quiz_id: str, question_id: str, hints_used: int = 0) -> Dict[str, Any]:
        """Get hint for written question"""
        try:
            # Get quiz and question
            quiz = await self.db.quizzes.find_one({
                "_id": quiz_id,
                "userId": user_id
            })
            
            if not quiz:
                raise ValueError("Quiz not found")
            
            # Find the question
            question = None
            for q in quiz["questions"]:
                if q["id"] == question_id:
                    question = q
                    break
            
            if not question or question["type"] != "written":
                raise ValueError("Question not found or not a written question")
            
            hint_pool = question.get("hintPool", [])
            max_hints = len(hint_pool)
            
            if hints_used >= max_hints:
                return {
                    "hint": None,
                    "hintsRemaining": 0,
                    "maxHints": max_hints
                }
            
            hint = hint_pool[hints_used] if hints_used < len(hint_pool) else None
            
            return {
                "hint": hint,
                "hintsRemaining": max(0, max_hints - hints_used - 1),
                "maxHints": max_hints
            }
            
        except Exception as e:
            logger.error(f"Error getting hint: {e}")
            raise
    
    async def get_quiz_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user's quiz statistics"""
        try:
            pipeline = [
                {"$match": {"userId": user_id, "completedAt": {"$exists": True}}},
                {
                    "$group": {
                        "_id": None,
                        "totalQuizzes": {"$sum": 1},
                        "averageScore": {"$avg": {"$divide": ["$score", "$maxScore"]}},
                        "bestScore": {"$max": {"$divide": ["$score", "$maxScore"]}},
                        "totalQuestions": {"$sum": {"$size": {"$ifNull": ["$questions", []]}}},
                        "lastCompleted": {"$max": "$completedAt"}
                    }
                }
            ]
            
            stats = await self.db.quizzes.aggregate(pipeline).to_list(length=1)
            
            if stats:
                stat = stats[0]
                return {
                    "totalQuizzes": stat["totalQuizzes"],
                    "averageScore": round(stat["averageScore"] * 100, 1),
                    "bestScore": round(stat["bestScore"] * 100, 1),
                    "totalQuestions": stat["totalQuestions"],
                    "lastCompleted": stat["lastCompleted"]
                }
            else:
                return {
                    "totalQuizzes": 0,
                    "averageScore": 0,
                    "bestScore": 0,
                    "totalQuestions": 0,
                    "lastCompleted": None
                }
                
        except Exception as e:
            logger.error(f"Error getting quiz stats: {e}")
            return {}
    
    async def delete_quiz(self, user_id: str, quiz_id: str) -> bool:
        """Delete quiz"""
        try:
            result = await self.db.quizzes.delete_one({
                "_id": quiz_id,
                "userId": user_id
            })
            
            if result.deleted_count > 0:
                # Log activity
                await self._log_activity("quiz_deleted", user_id, {
                    "quizId": quiz_id
                })
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting quiz: {e}")
            return False
    
    async def _get_quiz_content(self, source: QuizSource, topic: Optional[str], 
                              session_id: Optional[str], note_id: Optional[str], 
                              user_id: str) -> Dict[str, Any]:
        """Get content for quiz generation based on source"""
        if source == QuizSource.TOPIC:
            return {"topic": topic, "sourceId": None}
        
        elif source == QuizSource.CHAT:
            session = await self.db.chat_sessions.find_one({
                "_id": session_id,
                "userId": user_id
            })
            
            if not session:
                raise ValueError("Chat session not found")
            
            # Get messages for content
            messages = await self.db.messages.find(
                {"sessionId": session_id}
            ).sort("timestamp", 1).to_list(length=50)
            
            content_text = " ".join([msg["content"] for msg in messages])
            topic = session.get("title", "Chat Discussion")
            
            return {
                "topic": topic,
                "content": content_text[:1000],  # Limit content length
                "sourceId": session_id
            }
        
        elif source == QuizSource.NOTES:
            note = await self.db.notes.find_one({
                "_id": note_id,
                "userId": user_id
            })
            
            if not note:
                raise ValueError("Note not found")
            
            return {
                "topic": note["topic"],
                "content": note["content"][:1000],
                "sourceId": note_id
            }
    
    async def _calculate_score(self, questions: List[Dict], answers: Dict[str, Any], 
                             written_answers: Optional[Dict[str, Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Calculate quiz score"""
        total_score = 0
        question_results = []
        
        for question in questions:
            question_id = question["id"]
            question_type = question["type"]
            
            if question_type == "mcq":
                user_answer = answers.get(question_id)
                correct_answer = question.get("correct")
                
                if user_answer == correct_answer:
                    question_score = 10
                else:
                    question_score = 0
                
                total_score += question_score
                
                question_results.append({
                    "questionId": question_id,
                    "type": question_type,
                    "userAnswer": user_answer,
                    "correctAnswer": correct_answer,
                    "score": question_score,
                    "maxScore": 10
                })
            
            elif question_type == "written":
                written_data = written_answers.get(question_id, {}) if written_answers else {}
                quality = written_data.get("quality", 0.5)  # Default quality if not evaluated
                
                question_score = int(quality * 10)
                total_score += question_score
                
                question_results.append({
                    "questionId": question_id,
                    "type": question_type,
                    "quality": quality,
                    "score": question_score,
                    "maxScore": 10
                })
            
            elif question_type == "true_false":
                user_answer = answers.get(question_id)
                correct_answer = question.get("correct_bool")
                
                if user_answer == correct_answer:
                    question_score = 10
                else:
                    question_score = 0
                
                total_score += question_score
                
                question_results.append({
                    "questionId": question_id,
                    "type": question_type,
                    "userAnswer": user_answer,
                    "correctAnswer": correct_answer,
                    "score": question_score,
                    "maxScore": 10
                })
        
        return {
            "score": total_score,
            "questionResults": question_results
        }
    
    async def _generate_feedback(self, score: int, max_score: int) -> Dict[str, Any]:
        """Generate quiz feedback"""
        percentage = (score / max_score) * 100
        
        if percentage >= 90:
            message = "Excellent work! You have mastered this topic."
            suggestions = [
                "Try teaching this topic to someone else to reinforce your understanding",
                "Explore advanced topics in this area",
                "Create practice questions for yourself"
            ]
        elif percentage >= 70:
            message = "Good job! You have a solid understanding of this topic."
            suggestions = [
                "Review the questions you got wrong",
                "Practice with similar problems",
                "Try explaining the concepts in your own words"
            ]
        elif percentage >= 60:
            message = "You're on the right track. Keep studying to improve."
            suggestions = [
                "Review the fundamental concepts",
                "Work through more practice problems",
                "Ask for help on topics you find difficult"
            ]
        else:
            message = "Keep practicing! Learning takes time and effort."
            suggestions = [
                "Go back to the basics and study the fundamentals",
                "Break down complex topics into smaller parts",
                "Use different learning resources (videos, books, etc.)"
            ]
        
        return {
            "message": message,
            "suggestions": suggestions
        }
    
    async def _log_activity(self, action: str, user_id: str, metadata: Optional[Dict[str, Any]] = None):
        """Log quiz activity"""
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
quiz_service = QuizService()
