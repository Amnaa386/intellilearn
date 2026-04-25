import json
import re
from typing import Dict, List, Optional, Any
from .ai_services import AIService

class ContentGenerator:
    def __init__(self):
        self.ai_service = AIService()
    
    async def generate_structured_content(self, message: str, intent_type: str) -> Optional[Dict[str, Any]]:
        """Generate structured content based on intent type"""
        
        try:
            if intent_type == "notes":
                return await self._generate_notes(message)
            elif intent_type == "ppt":
                return await self._generate_ppt(message)
            elif intent_type == "quiz":
                return await self._generate_quiz(message)
            else:
                return None
        except Exception as e:
            print(f"Content generation error: {e}")
            return None
    
    async def _generate_notes(self, topic: str) -> Optional[Dict[str, Any]]:
        """Generate structured study notes"""
        prompt = f"""
        Generate comprehensive, well-structured study notes on: {topic}
        
        Format the response as valid JSON with this exact structure:
        {{
            "title": "Clear, descriptive title",
            "introduction": "Brief 2-3 sentence introduction",
            "key_points": [
                {{
                    "heading": "Main point heading",
                    "content": "Detailed explanation (2-3 sentences)",
                    "sub_points": ["Sub point 1", "Sub point 2", "Sub point 3"]
                }}
            ],
            "summary": "Concluding summary (2-3 sentences)",
            "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
        }}
        
        Ensure the JSON is valid and complete.
        """
        
        response = await self.ai_service.gemini_generate(prompt)
        if response:
            try:
                # Clean up the response to extract JSON
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    return json.loads(json_str)
            except json.JSONDecodeError:
                print("Failed to parse JSON from Gemini response")
        
        return None
    
    async def _generate_ppt(self, topic: str) -> Optional[Dict[str, Any]]:
        """Generate PowerPoint presentation structure"""
        prompt = f"""
        Generate a PowerPoint presentation structure on: {topic}
        
        Create exactly 8-10 slides including title and conclusion.
        
        Format the response as valid JSON with this exact structure:
        {{
            "title": "Presentation Title",
            "total_slides": 8,
            "slides": [
                {{
                    "slide_number": 1,
                    "title": "Slide Title",
                    "content": "Main content points as bullet points",
                    "speaker_notes": "Detailed speaker notes for presenter"
                }}
            ]
        }}
        
        Ensure the JSON is valid and complete.
        """
        
        response = await self.ai_service.gemini_generate(prompt)
        if response:
            try:
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    return json.loads(json_str)
            except json.JSONDecodeError:
                print("Failed to parse JSON from Gemini response")
        
        return None
    
    async def _generate_quiz(self, topic: str) -> Optional[Dict[str, Any]]:
        """Generate multiple-choice quiz"""
        prompt = f"""
        Generate a multiple-choice quiz on: {topic}
        
        Create exactly 10 questions with 4 options each.
        
        Format the response as valid JSON with this exact structure:
        {{
            "title": "Quiz Title",
            "total_questions": 10,
            "questions": [
                {{
                    "question_number": 1,
                    "question": "Clear question text",
                    "options": [
                        "A) First option",
                        "B) Second option", 
                        "C) Third option",
                        "D) Fourth option"
                    ],
                    "correct_answer": "A) First option",
                    "explanation": "Brief explanation of why this is correct"
                }}
            ]
        }}
        
        Ensure the JSON is valid and complete.
        """
        
        response = await self.ai_service.gemini_generate(prompt)
        if response:
            try:
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    return json.loads(json_str)
            except json.JSONDecodeError:
                print("Failed to parse JSON from Gemini response")
        
        return None
    
    def format_content_for_display(self, structured_content: Dict[str, Any], intent_type: str) -> str:
        """Format structured content for chat display"""
        
        if intent_type == "notes":
            return self._format_notes_display(structured_content)
        elif intent_type == "ppt":
            return self._format_ppt_display(structured_content)
        elif intent_type == "quiz":
            return self._format_quiz_display(structured_content)
        
        return str(structured_content)
    
    def _format_notes_display(self, notes: Dict[str, Any]) -> str:
        """Format notes for chat display"""
        formatted = f"## {notes.get('title', 'Study Notes')}\n\n"
        formatted += f"**Introduction:** {notes.get('introduction', '')}\n\n"
        
        for point in notes.get('key_points', []):
            formatted += f"### {point.get('heading', '')}\n"
            formatted += f"{point.get('content', '')}\n\n"
            
            if point.get('sub_points'):
                formatted += "**Key Points:**\n"
                for sub_point in point['sub_points']:
                    formatted += f"- {sub_point}\n"
                formatted += "\n"
        
        formatted += f"**Summary:** {notes.get('summary', '')}\n\n"
        
        if notes.get('keywords'):
            formatted += "**Keywords:** " + ", ".join(notes['keywords'])
        
        return formatted
    
    def _format_ppt_display(self, ppt: Dict[str, Any]) -> str:
        """Format PPT structure for chat display"""
        formatted = f"## {ppt.get('title', 'Presentation')}\n\n"
        formatted += f"**Total Slides:** {ppt.get('total_slides', 0)}\n\n"
        
        for slide in ppt.get('slides', []):
            formatted += f"### Slide {slide.get('slide_number', '')}: {slide.get('title', '')}\n"
            formatted += f"**Content:** {slide.get('content', '')}\n"
            formatted += f"**Speaker Notes:** {slide.get('speaker_notes', '')}\n\n"
        
        return formatted
    
    def _format_quiz_display(self, quiz: Dict[str, Any]) -> str:
        """Format quiz for chat display"""
        formatted = f"## {quiz.get('title', 'Quiz')}\n\n"
        formatted += f"**Total Questions:** {quiz.get('total_questions', 0)}\n\n"
        
        for question in quiz.get('questions', []):
            formatted += f"### Question {question.get('question_number', '')}\n"
            formatted += f"{question.get('question', '')}\n\n"
            
            for option in question.get('options', []):
                formatted += f"{option}\n"
            
            formatted += f"\n**Correct Answer:** {question.get('correct_answer', '')}\n"
            formatted += f"**Explanation:** {question.get('explanation', '')}\n\n"
        
        return formatted
