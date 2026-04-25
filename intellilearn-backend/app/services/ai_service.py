import openai
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
from app.core.config import settings
from app.core.redis import set_cache, get_cache
import json
import hashlib

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        if settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
        else:
            logger.warning("OpenAI API key not configured")
    
    async def generate_chat_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate AI chat response using OpenAI"""
        try:
            # Create cache key for similar queries
            cache_key = f"chat_response:{hashlib.md5(message.encode()).hexdigest()}"
            
            # Try to get cached response
            cached_response = await get_cache(cache_key)
            if cached_response:
                logger.info("Returning cached chat response")
                return cached_response
            
            # Prepare messages for OpenAI
            messages = [
                {
                    "role": "system",
                    "content": """You are Dr. Intelli, an AI tutor for the IntelliLearn platform. You are helpful, knowledgeable, and encouraging.
                    
                    Guidelines:
                    - Provide clear, educational responses
                    - Be encouraging and supportive
                    - Ask follow-up questions to engage the user
                    - Keep responses concise but thorough
                    - Use examples when helpful
                    - Adapt to the user's level of understanding
                    """
                }
            ]
            
            # Add context if provided
            if context and context.get("chat_history"):
                messages.extend(context["chat_history"])
            
            # Add current message
            messages.append({
                "role": "user",
                "content": message
            })
            
            # Call OpenAI API
            response = await openai.ChatCompletion.acreate(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=1000,
                temperature=0.7,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            ai_message = response.choices[0].message.content
            usage = response.usage
            
            result = {
                "message": ai_message,
                "usage": {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens
                }
            }
            
            # Cache the response
            await set_cache(cache_key, result, 3600)  # Cache for 1 hour
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating chat response: {e}")
            raise
    
    async def generate_notes(self, topic: str, complexity: str = "simple", include_questions: bool = True) -> Dict[str, Any]:
        """Generate AI study notes"""
        try:
            cache_key = f"notes:{hashlib.md5(f'{topic}_{complexity}_{include_questions}'.encode()).hexdigest()}"
            
            # Try cache first
            cached_notes = await get_cache(cache_key)
            if cached_notes:
                return cached_notes
            
            # Determine complexity level
            if complexity == "detailed":
                prompt = f"""Generate comprehensive study notes for the topic: {topic}
                
                Requirements:
                - Create detailed, structured notes suitable for advanced study
                - Include executive summary and learning objectives
                - Cover fundamental concepts, theoretical frameworks, and practical applications
                - Include examples and real-world applications
                - Add practice questions and assessment preparation
                - Format with clear headings and bullet points
                - Aim for 1500-2000 words
                """
            else:
                prompt = f"""Generate simple study notes for the topic: {topic}
                
                Requirements:
                - Create clear, concise notes suitable for quick learning
                - Focus on main concepts and key points
                - Include basic examples
                - Keep it under 500 words
                - Use simple language
                - Include a few quick practice questions
                """
            
            if include_questions:
                prompt += "\n\nInclude relevant practice questions at the end."
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert educational content creator. Generate clear, accurate, and well-structured study materials."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = await openai.ChatCompletion.acreate(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=2000 if complexity == "detailed" else 800,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            result = {
                "title": f"Study Notes: {topic}",
                "content": content,
                "type": complexity,
                "generatedAt": datetime.utcnow().isoformat(),
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
            # Cache the result
            await set_cache(cache_key, result, 7200)  # Cache for 2 hours
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating notes: {e}")
            raise
    
    async def generate_quiz(self, topic: str, question_count: int = 5, difficulty: str = "medium", question_types: List[str] = ["mcq"]) -> Dict[str, Any]:
        """Generate AI quiz questions"""
        try:
            cache_key = f"quiz:{hashlib.md5(f'{topic}_{question_count}_{difficulty}_{"".join(question_types)}'.encode()).hexdigest()}"
            
            # Try cache first
            cached_quiz = await get_cache(cache_key)
            if cached_quiz:
                return cached_quiz
            
            # Build prompt based on question types
            prompt_parts = [f"Generate {question_count} quiz questions about: {topic}"]
            
            if "mcq" in question_types:
                prompt_parts.append("Include multiple-choice questions with 4 options each")
            if "written" in question_types:
                prompt_parts.append("Include written response questions")
            if "true_false" in question_types:
                prompt_parts.append("Include true/false questions")
            
            prompt_parts.extend([
                f"Difficulty level: {difficulty}",
                "Format as JSON with the following structure:",
                '{"questions": [{"id": "q1", "type": "mcq", "question": "...", "options": ["...", "...", "...", "..."], "correct": 0, "explanation": "..."}]}',
                "Ensure all questions are clear and accurate"
            ])
            
            prompt = "\n".join(prompt_parts)
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert educational assessment creator. Generate high-quality quiz questions that test understanding effectively."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = await openai.ChatCompletion.acreate(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=1500,
                temperature=0.4
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON response
            try:
                quiz_data = json.loads(content)
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract JSON from the text
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    quiz_data = json.loads(json_match.group())
                else:
                    raise ValueError("Failed to parse quiz JSON from AI response")
            
            result = {
                "questions": quiz_data.get("questions", []),
                "title": f"Quiz: {topic}",
                "difficulty": difficulty,
                "questionCount": len(quiz_data.get("questions", [])),
                "generatedAt": datetime.utcnow().isoformat(),
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
            # Cache the result
            await set_cache(cache_key, result, 3600)  # Cache for 1 hour
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            raise
    
    async def explain_ppt_slide(self, slide_content: str, slide_number: int, context: Optional[str] = None) -> Dict[str, Any]:
        """Explain PowerPoint slide content"""
        try:
            prompt = f"""Explain this PowerPoint slide (Slide {slide_number}) in simple, educational terms:
            
            Slide Content:
            {slide_content}
            
            {f'Additional Context: {context}' if context else ''}
            
            Provide:
            1. A clear explanation of the main concepts
            2. Key takeaways
            3. Real-world examples if applicable
            4. Questions to check understanding
            
            Keep it concise but thorough (200-300 words)."""
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert educator who can explain complex concepts in simple terms. Help students understand presentation content effectively."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = await openai.ChatCompletion.acreate(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=500,
                temperature=0.5
            )
            
            explanation = response.choices[0].message.content
            
            result = {
                "explanation": explanation,
                "slideNumber": slide_number,
                "keyPoints": self._extract_key_points(explanation),
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error explaining PPT slide: {e}")
            raise
    
    async def generate_voice_lesson(self, topic: str, duration: int = 5, style: str = "explanation") -> Dict[str, Any]:
        """Generate voice lesson script"""
        try:
            # Calculate approximate word count based on duration (150 words per minute)
            word_count = duration * 150
            
            style_instructions = {
                "explanation": "Provide a clear, educational explanation",
                "story": "Create an engaging narrative or story",
                "conversation": "Write as an interactive conversation"
            }
            
            prompt = f"""Generate a {duration}-minute voice lesson script about: {topic}
            
            Style: {style_instructions.get(style, "Provide a clear explanation")}
            
            Requirements:
            - Approximately {word_count} words
            - Natural, conversational tone
            - Clear structure with introduction, main content, and conclusion
            - Include pauses and emphasis indicators
            - Make it engaging and easy to follow
            
            Format with:
            [PAUSE] for natural breaks
            **emphasis** for important points
            (SPEAK SLOWER) for difficult concepts
            """
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert educational content creator specializing in audio learning materials."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = await openai.ChatCompletion.acreate(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=word_count * 2,  # Allow for formatting
                temperature=0.6
            )
            
            script = response.choices[0].message.content
            
            result = {
                "script": script,
                "topic": topic,
                "duration": duration,
                "style": style,
                "estimatedWordCount": len(script.split()),
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating voice lesson: {e}")
            raise
    
    async def evaluate_written_answer(self, question: str, answer: str, model_answer: Optional[str] = None) -> Dict[str, Any]:
        """Evaluate written answer quality"""
        try:
            prompt = f"""Evaluate this student's answer:
            
            Question: {question}
            Student's Answer: {answer}
            {f'Model Answer: {model_answer}' if model_answer else ''}
            
            Provide evaluation in JSON format:
            {{
                "quality": 0.85,
                "feedback": ["Good understanding of key concepts", "Could include more specific examples"],
                "highlights": [
                    {"start": 10, "end": 20, "label": "Good point"},
                    {"start": 30, "end": 40, "label": "Vague phrasing"}
                ],
                "meetsLength": true,
                "suggestions": ["Add more specific examples", "Include relevant statistics"]
            }}
            
            Quality should be between 0.0 and 1.0
            Provide constructive, encouraging feedback"""
            
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert educator who provides fair, constructive feedback on student answers."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            response = await openai.ChatCompletion.acreate(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=500,
                temperature=0.3
            )
            
            evaluation_text = response.choices[0].message.content
            
            # Parse JSON response
            try:
                evaluation = json.loads(evaluation_text)
            except json.JSONDecodeError:
                # Fallback evaluation
                evaluation = {
                    "quality": 0.7,
                    "feedback": ["Answer provided", "Could be more detailed"],
                    "highlights": [],
                    "meetsLength": len(answer) >= 50,
                    "suggestions": ["Add more detail and examples"]
                }
            
            return evaluation
            
        except Exception as e:
            logger.error(f"Error evaluating written answer: {e}")
            raise
    
    def _extract_key_points(self, text: str) -> List[str]:
        """Extract key points from explanation text"""
        # Simple implementation - could be enhanced with AI
        sentences = text.split('.')
        key_points = []
        
        for sentence in sentences[:5]:  # Take first 5 sentences as key points
            sentence = sentence.strip()
            if len(sentence) > 20:  # Only include substantial sentences
                key_points.append(sentence)
        
        return key_points

# Singleton instance
ai_service = AIService()
