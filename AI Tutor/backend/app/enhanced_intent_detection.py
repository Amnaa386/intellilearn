import re
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class IntentType(Enum):
    EXPLANATION = "explanation"
    NOTES = "notes"
    QUIZ = "quiz"
    PPT = "ppt"
    SHORT_QUESTIONS = "short_questions"
    LONG_QUESTIONS = "long_questions"
    COMPARISON = "comparison"
    PROBLEM_SOLVING = "problem_solving"
    SUMMARY = "summary"
    EXAMPLES = "examples"

@dataclass
class IntentResult:
    intent: IntentType
    confidence: float
    reasoning: str
    complexity_score: float
    keywords_found: List[str]
    fallback_needed: bool = False

class EnhancedIntentDetector:
    def __init__(self):
        # Enhanced keyword patterns with weights
        self.intent_patterns = {
            IntentType.EXPLANATION: {
                "keywords": [
                    "explain", "what is", "how does", "why", "tell me about", 
                    "describe", "define", "meaning", "concept", "understand",
                    "clarify", "elaborate", "break down", "simplify"
                ],
                "weight": 1.0,
                "complexity_threshold": 0.3
            },
            IntentType.NOTES: {
                "keywords": [
                    "notes", "study notes", "summarize", "summary", "key points",
                    "important points", "revision", "study material", "outline",
                    "highlights", "main ideas", "essential points"
                ],
                "weight": 1.2,
                "complexity_threshold": 0.4
            },
            IntentType.QUIZ: {
                "keywords": [
                    "quiz", "test", "questions", "practice", "mcq", "multiple choice",
                    "exam", "assessment", "evaluate", "check understanding",
                    "test me", "quiz me", "questions about"
                ],
                "weight": 1.1,
                "complexity_threshold": 0.5
            },
            IntentType.PPT: {
                "keywords": [
                    "ppt", "powerpoint", "presentation", "slides", "slide deck",
                    "present", "visual", "presentation structure", "create slides"
                ],
                "weight": 1.3,
                "complexity_threshold": 0.6
            },
            IntentType.SHORT_QUESTIONS: {
                "keywords": [
                    "short questions", "brief", "quick", "simple", "basic",
                    "easy questions", "short answer", "quick questions"
                ],
                "weight": 0.8,
                "complexity_threshold": 0.2
            },
            IntentType.LONG_QUESTIONS: {
                "keywords": [
                    "long questions", "detailed", "comprehensive", "in-depth",
                    "extensive", "thorough", "detailed analysis", "elaborate"
                ],
                "weight": 1.4,
                "complexity_threshold": 0.8
            },
            IntentType.COMPARISON: {
                "keywords": [
                    "compare", "contrast", "difference", "versus", "vs",
                    "similarities", "differences", "better", "worse"
                ],
                "weight": 1.2,
                "complexity_threshold": 0.7
            },
            IntentType.PROBLEM_SOLVING: {
                "keywords": [
                    "solve", "problem", "solution", "how to", "step by step",
                    "method", "approach", "algorithm", "calculate"
                ],
                "weight": 1.3,
                "complexity_threshold": 0.8
            },
            IntentType.SUMMARY: {
                "keywords": [
                    "summarize", "summary", "recap", "overview", "brief",
                    "in short", "key takeaways", "main points"
                ],
                "weight": 1.0,
                "complexity_threshold": 0.3
            },
            IntentType.EXAMPLES: {
                "keywords": [
                    "examples", "example", "illustrate", "demonstrate",
                    "show me", "for instance", "such as", "like"
                ],
                "weight": 0.9,
                "complexity_threshold": 0.4
            }
        }
        
        # Complex query indicators
        self.complexity_indicators = {
            "high": [
                "analyze", "synthesize", "evaluate", "critique", "comprehensive",
                "detailed analysis", "in-depth", "extensive", "thorough",
                "systematic", "methodical", "exhaustive"
            ],
            "medium": [
                "compare", "contrast", "relationship", "impact", "effect",
                "influence", "correlation", "connection", "interrelation"
            ],
            "low": [
                "what", "who", "when", "where", "list", "name", "identify"
            ]
        }
        
        # Question patterns
        self.question_patterns = {
            "why": r"\bwhy\b",
            "how": r"\bhow\b",
            "what": r"\bwhat\b",
            "when": r"\bwhen\b",
            "where": r"\bwhere\b",
            "who": r"\bwho\b",
            "which": r"\bwhich\b"
        }

    def calculate_keyword_score(self, message: str, intent: IntentType) -> Tuple[float, List[str]]:
        """Calculate keyword-based score with weights"""
        message_lower = message.lower()
        pattern = self.intent_patterns[intent]
        keywords_found = []
        total_score = 0
        
        for keyword in pattern["keywords"]:
            if keyword in message_lower:
                # Weight by keyword length and specificity
                keyword_weight = len(keyword.split()) * 0.1 + 0.9
                total_score += pattern["weight"] * keyword_weight
                keywords_found.append(keyword)
        
        # Normalize score
        max_possible = len(pattern["keywords"]) * pattern["weight"] * 1.5
        normalized_score = min(total_score / max_possible, 1.0) if max_possible > 0 else 0
        
        return normalized_score, keywords_found

    def calculate_complexity_score(self, message: str) -> float:
        """Calculate complexity score based on various indicators"""
        message_lower = message.lower()
        complexity_score = 0.3  # Base complexity
        
        # Check for complexity indicators
        for level, indicators in self.complexity_indicators.items():
            for indicator in indicators:
                if indicator in message_lower:
                    if level == "high":
                        complexity_score += 0.3
                    elif level == "medium":
                        complexity_score += 0.2
                    else:
                        complexity_score += 0.1
        
        # Question type affects complexity
        for pattern_name, pattern in self.question_patterns.items():
            if re.search(pattern, message_lower):
                if pattern_name in ["why", "how"]:
                    complexity_score += 0.2
                elif pattern_name in ["what", "which"]:
                    complexity_score += 0.1
        
        # Message length affects complexity
        word_count = len(message.split())
        if word_count > 20:
            complexity_score += 0.2
        elif word_count > 10:
            complexity_score += 0.1
        
        return min(complexity_score, 1.0)

    def detect_intent_pattern_matching(self, message: str) -> IntentResult:
        """Enhanced pattern matching with complexity analysis"""
        message_lower = message.lower()
        intent_scores = {}
        keywords_by_intent = {}
        
        # Calculate scores for all intents
        for intent in IntentType:
            score, keywords = self.calculate_keyword_score(message, intent)
            intent_scores[intent] = score
            keywords_by_intent[intent] = keywords
        
        # Find best intent
        best_intent = max(intent_scores, key=intent_scores.get)
        confidence = intent_scores[best_intent]
        keywords_found = keywords_by_intent[best_intent]
        
        # Calculate complexity
        complexity_score = self.calculate_complexity_score(message)
        
        # Determine if fallback is needed
        pattern = self.intent_patterns[best_intent]
        fallback_needed = confidence < 0.3 or complexity_score < pattern["complexity_threshold"]
        
        # Generate reasoning
        reasoning = self._generate_reasoning(best_intent, confidence, keywords_found, complexity_score)
        
        return IntentResult(
            intent=best_intent,
            confidence=confidence,
            reasoning=reasoning,
            complexity_score=complexity_score,
            keywords_found=keywords_found,
            fallback_needed=fallback_needed
        )

    def _generate_reasoning(self, intent: IntentType, confidence: float, 
                          keywords: List[str], complexity: float) -> str:
        """Generate human-readable reasoning for intent detection"""
        if confidence > 0.7:
            confidence_desc = "high confidence"
        elif confidence > 0.4:
            confidence_desc = "moderate confidence"
        else:
            confidence_desc = "low confidence"
        
        if complexity > 0.7:
            complexity_desc = "high complexity"
        elif complexity > 0.4:
            complexity_desc = "medium complexity"
        else:
            complexity_desc = "low complexity"
        
        reasoning = f"Detected {intent.value} with {confidence_desc}"
        if keywords:
            reasoning += f" based on keywords: {', '.join(keywords[:3])}"
        reasoning += f". Query complexity: {complexity_desc}"
        
        return reasoning

    async def detect_intent(self, message: str) -> IntentResult:
        """Main intent detection method"""
        try:
            # Primary detection through pattern matching
            result = self.detect_intent_pattern_matching(message)
            
            # Log the detection result for monitoring
            logger.info(f"Intent detected: {result.intent.value} (confidence: {result.confidence:.2f})")
            
            return result
            
        except Exception as e:
            logger.error(f"Intent detection failed: {str(e)}")
            # Fallback to explanation
            return IntentResult(
                intent=IntentType.EXPLANATION,
                confidence=0.5,
                reasoning="Fallback due to detection error",
                complexity_score=0.5,
                keywords_found=[],
                fallback_needed=True
            )

    def get_api_routing_recommendation(self, intent_result: IntentResult) -> Dict[str, any]:
        """Get API routing recommendation based on intent"""
        routing = {
            "primary_api": None,
            "fallback_apis": [],
            "prompt_type": "conversational",
            "requires_structured_output": False,
            "max_tokens": 1024,
            "temperature": 0.7
        }
        
        intent = intent_result.intent
        complexity = intent_result.complexity_score
        
        # Determine primary API based on intent
        if intent in [IntentType.NOTES, IntentType.PPT, IntentType.QUIZ]:
            routing["primary_api"] = "gemini"
            routing["requires_structured_output"] = True
            routing["prompt_type"] = "structured"
            routing["max_tokens"] = 2048
            routing["fallback_apis"] = ["deepseek", "groq"]
        elif intent == IntentType.EXPLANATION and complexity < 0.6:
            routing["primary_api"] = "groq"
            routing["prompt_type"] = "conversational"
            routing["max_tokens"] = 1024
            routing["fallback_apis"] = ["deepseek"]
        elif intent in [IntentType.LONG_QUESTIONS, IntentType.PROBLEM_SOLVING, IntentType.COMPARISON]:
            routing["primary_api"] = "deepseek"
            routing["prompt_type"] = "analytical"
            routing["max_tokens"] = 2048
            routing["temperature"] = 0.5
            routing["fallback_apis"] = ["groq", "gemini"]
        else:
            # Default routing
            routing["primary_api"] = "groq"
            routing["prompt_type"] = "conversational"
            routing["fallback_apis"] = ["deepseek"]
        
        return routing
