import re
from typing import Dict, List, Tuple
from .ai_services import AIService

class IntentDetector:
    def __init__(self):
        self.ai_service = AIService()
        
        # Intent patterns and keywords
        self.intent_patterns = {
            "explanation": [
                "explain", "what is", "how does", "why", "tell me about", 
                "describe", "define", "meaning", "concept", "understand"
            ],
            "notes": [
                "notes", "study notes", "summarize", "summary", "key points",
                "important points", "revision", "study material", "outline"
            ],
            "quiz": [
                "quiz", "test", "questions", "practice", "mcq", "multiple choice",
                "exam", "assessment", "evaluate", "check understanding"
            ],
            "ppt": [
                "ppt", "powerpoint", "presentation", "slides", "slide deck",
                "present", "visual", "presentation structure"
            ],
            "short_questions": [
                "short questions", "brief", "quick", "simple", "basic",
                "easy questions", "short answer"
            ],
            "long_questions": [
                "long questions", "detailed", "comprehensive", "in-depth",
                "extensive", "thorough", "detailed analysis"
            ]
        }
    
    def detect_intent_pattern_matching(self, message: str) -> Tuple[str, float]:
        """Detect intent using pattern matching"""
        message_lower = message.lower()
        intent_scores = {}
        
        for intent, keywords in self.intent_patterns.items():
            score = 0
            for keyword in keywords:
                if keyword in message_lower:
                    score += 1
            
            # Normalize score by number of keywords
            intent_scores[intent] = score / len(keywords)
        
        # Find the intent with highest score
        best_intent = max(intent_scores, key=intent_scores.get)
        confidence = intent_scores[best_intent]
        
        # If no strong pattern match, default to explanation
        if confidence < 0.1:
            return "explanation", 0.5
        
        return best_intent, confidence
    
    async def detect_intent_ai(self, message: str) -> Tuple[str, float]:
        """Use AI to detect intent for complex cases"""
        prompt = f"""
        Analyze this user message and determine the primary intent:
        Message: "{message}"
        
        Possible intents:
        - explanation: User wants to understand a concept
        - notes: User wants study notes or summary
        - quiz: User wants practice questions or test
        - ppt: User wants presentation slides
        - short_questions: User wants brief/simple questions
        - long_questions: User wants detailed/comprehensive questions
        
        Respond with just the intent name and confidence score (0-1) in format:
        intent|confidence
        """
        
        try:
            response = await self.ai_service.gemini_generate(prompt)
            if response:
                parts = response.strip().split('|')
                if len(parts) == 2:
                    intent = parts[0].strip()
                    confidence = float(parts[1].strip())
                    return intent, confidence
        except Exception as e:
            print(f"AI intent detection failed: {e}")
        
        return "explanation", 0.5
    
    async def detect_intent(self, message: str) -> Tuple[str, float]:
        """Hybrid intent detection combining pattern matching and AI"""
        # First try pattern matching (fast)
        intent, confidence = self.detect_intent_pattern_matching(message)
        
        # If confidence is low, use AI detection
        if confidence < 0.3:
            ai_intent, ai_confidence = await self.detect_intent_ai(message)
            
            # Use AI result if it's more confident
            if ai_confidence > confidence:
                intent, confidence = ai_intent, ai_confidence
        
        return intent, confidence
    
    def is_complex_query(self, message: str) -> bool:
        """Determine if query requires complex processing"""
        complex_indicators = [
            "compare", "contrast", "analyze", "evaluate", "synthesize",
            "relationship between", "impact of", "effect of", "detailed",
            "comprehensive", "in-depth", "extensive"
        ]
        
        message_lower = message.lower()
        return any(indicator in message_lower for indicator in complex_indicators)
