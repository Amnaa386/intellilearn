from typing import Dict, List, Any
from dataclasses import dataclass
from enum import Enum
import json

class PromptType(Enum):
    CONVERSATIONAL = "conversational"
    STRUCTURED = "structured"
    ANALYTICAL = "analytical"
    CREATIVE = "creative"

@dataclass
class PromptTemplate:
    system_prompt: str
    user_prompt_template: str
    response_format: str
    temperature: float
    max_tokens: int
    examples: List[Dict[str, str]]

class PromptTemplateManager:
    def __init__(self):
        self.templates = self._initialize_templates()
    
    def _initialize_templates(self) -> Dict[str, Dict[str, PromptTemplate]]:
        """Initialize all prompt templates for different intents and providers"""
        
        templates = {
            # EXPLANATION TEMPLATES
            "explanation": {
                "groq": PromptTemplate(
                    system_prompt="""You are a knowledgeable and patient AI tutor. Your goal is to explain concepts clearly and concisely. 

Guidelines:
- Use simple, accessible language
- Provide relevant examples
- Break down complex topics into smaller parts
- Be encouraging and supportive
- Keep explanations focused and to the point
- Use analogies when helpful""",
                    
                    user_prompt_template="""Please explain: {query}

{context_section}

Provide a clear, easy-to-understand explanation that helps me grasp this concept.""",
                    
                    response_format="text",
                    temperature=0.7,
                    max_tokens=1024,
                    examples=[
                        {"input": "What is photosynthesis?", "context": ""}
                    ]
                ),
                
                "gemini": PromptTemplate(
                    system_prompt="""You are an expert educational AI tutor specializing in providing clear, structured explanations. Your explanations should be comprehensive yet accessible.""",
                    
                    user_prompt_template="""EXPLANATION REQUEST: {query}

{context_section}

Please provide a detailed explanation that includes:
1. A simple definition
2. Key components or processes
3. Real-world examples
4. Common misconceptions to avoid

Structure your response clearly with headings.""",
                    
                    response_format="structured_text",
                    temperature=0.6,
                    max_tokens=1500,
                    examples=[]
                ),
                
                "deepseek": PromptTemplate(
                    system_prompt="""You are an AI tutor with deep expertise across multiple subjects. Provide thorough, analytical explanations that cover both the 'what' and the 'why' of concepts.""",
                    
                    user_prompt_template="""TOPIC: {query}

{context_section}

Provide a comprehensive explanation that addresses:
- Fundamental principles
- Underlying mechanisms
- Practical applications
- Connections to related concepts
- Potential challenges or limitations

Be thorough but maintain clarity.""",
                    
                    response_format="analytical_text",
                    temperature=0.5,
                    max_tokens=2048,
                    examples=[]
                )
            },
            
            # NOTES TEMPLATES
            "notes": {
                "gemini": PromptTemplate(
                    system_prompt="""You are an expert at creating structured, comprehensive study notes. Your notes should be organized, easy to review, and exam-ready.""",
                    
                    user_prompt_template="""Create comprehensive study notes on: {query}

{context_section}

Generate notes in this exact JSON format:
{{
    "title": "Clear, descriptive title",
    "subject_area": "Academic subject area",
    "difficulty_level": "Beginner|Intermediate|Advanced",
    "estimated_study_time": "X minutes",
    "introduction": "Brief 2-3 sentence overview",
    "key_concepts": [
        {{
            "concept": "Concept name",
            "definition": "Clear definition",
            "importance": "Why this matters",
            "example": "Practical example"
        }}
    ],
    "detailed_points": [
        {{
            "heading": "Main topic heading",
            "content": "Detailed explanation (2-3 sentences)",
            "sub_points": ["Supporting point 1", "Supporting point 2"],
            "visual_aid_description": "How to visualize this"
        }}
    ],
    "summary": "Concise summary of key takeaways",
    "study_questions": [
        "Question 1 for self-testing",
        "Question 2 for self-testing"
    ],
    "related_topics": ["Topic 1", "Topic 2"],
    "keywords": ["keyword1", "keyword2", "keyword3"]
}}""",
                    
                    response_format="json",
                    temperature=0.3,
                    max_tokens=2500,
                    examples=[]
                ),
                
                "deepseek": PromptTemplate(
                    system_prompt="""Create detailed, academically rigorous study notes with comprehensive coverage of the topic.""",
                    
                    user_prompt_template="""Generate comprehensive study notes on: {query}

{context_section}

Structure the notes with:
1. Learning objectives
2. Core concepts with definitions
3. Detailed explanations with examples
4. Visual learning suggestions
5. Practice problems or exercises
6. Summary and key takeaways
7. Further reading suggestions

Format as well-structured text with clear headings.""",
                    
                    response_format="structured_text",
                    temperature=0.4,
                    max_tokens=3000,
                    examples=[]
                ),
                
                "groq": PromptTemplate(
                    system_prompt="""Create concise, focused study notes that are easy to review and remember.""",
                    
                    user_prompt_template="""Create study notes on: {query}

{context_section}

Include:
- Main points
- Key definitions
- Important examples
- Quick summary

Keep it concise and easy to memorize.""",
                    
                    response_format="text",
                    temperature=0.5,
                    max_tokens=1500,
                    examples=[]
                )
            },
            
            # QUIZ TEMPLATES
            "quiz": {
                "gemini": PromptTemplate(
                    system_prompt="""You are an expert educational assessment creator. Generate high-quality, fair questions that accurately test understanding.""",
                    
                    user_prompt_template="""Create a comprehensive quiz on: {query}

{context_section}

Generate a quiz in this exact JSON format:
{{
    "quiz_title": "Descriptive quiz title",
    "subject": "Subject area",
    "difficulty": "Easy|Medium|Hard",
    "total_questions": 10,
    "estimated_time": "X minutes",
    "instructions": "Clear instructions for taking the quiz",
    "questions": [
        {{
            "question_number": 1,
            "question_type": "multiple_choice",
            "question": "Clear question text",
            "options": [
                "A) First option",
                "B) Second option", 
                "C) Third option",
                "D) Fourth option"
            ],
            "correct_answer": "A) First option",
            "explanation": "Detailed explanation of why this is correct",
            "difficulty": "Easy|Medium|Hard",
            "topic": "Specific topic being tested"
        }}
    ],
    "answer_key": {{
        "1": "A) First option",
        "2": "B) Second option"
    }},
    "scoring_guide": "How to interpret results",
    "study_recommendations": ["Area 1 to review", "Area 2 to review"]
}}""",
                    
                    response_format="json",
                    temperature=0.2,
                    max_tokens=3000,
                    examples=[]
                ),
                
                "deepseek": PromptTemplate(
                    system_prompt="""Create challenging, comprehensive quizzes that thoroughly test understanding of the topic.""",
                    
                    user_prompt_template="""Generate a thorough quiz on: {query}

{context_section}

Include:
- Multiple choice questions
- True/false questions
- Short answer questions
- One essay question

Provide answer key with explanations for each question.""",
                    
                    response_format="structured_text",
                    temperature=0.3,
                    max_tokens=2500,
                    examples=[]
                )
            },
            
            # PPT TEMPLATES
            "ppt": {
                "gemini": PromptTemplate(
                    system_prompt="""You are an expert presentation designer. Create clear, engaging presentation structures that communicate ideas effectively.""",
                    
                    user_prompt_template="""Create a PowerPoint presentation structure on: {query}

{context_section}

Generate a presentation in this exact JSON format:
{{
    "presentation_title": "Engaging presentation title",
    "target_audience": "Students|Professionals|General",
    "presentation_length": "X minutes",
    "total_slides": 8,
    "learning_objectives": [
        "Objective 1",
        "Objective 2"
    ],
    "slides": [
        {{
            "slide_number": 1,
            "slide_type": "title",
            "title": "Slide Title",
            "content": "Main content points or key message",
            "speaker_notes": "Detailed speaker notes (2-3 sentences)",
            "visual_suggestions": "What kind of visual would work here",
            "interaction_element": "Question, poll, or activity suggestion"
        }}
    ],
    "conclusion": "Strong concluding message",
    "q_a_suggestions": ["Potential question 1", "Potential question 2"],
    "resources": ["Resource 1", "Resource 2"]
}}""",
                    
                    response_format="json",
                    temperature=0.3,
                    max_tokens=2800,
                    examples=[]
                ),
                
                "deepseek": PromptTemplate(
                    system_prompt="""Create comprehensive presentation outlines with detailed content for professional and academic settings.""",
                    
                    user_prompt_template="""Create a detailed presentation outline on: {query}

{context_section}

Structure with:
- Title slide
- Introduction/agenda
- Main content slides (8-10)
- Case studies or examples
- Conclusion
- Q&A preparation

Include speaker notes and visual suggestions for each slide.""",
                    
                    response_format="structured_text",
                    temperature=0.4,
                    max_tokens=2500,
                    examples=[]
                )
            },
            
            # COMPARISON TEMPLATES
            "comparison": {
                "deepseek": PromptTemplate(
                    system_prompt="""You are an expert at analytical comparisons. Provide balanced, insightful comparisons that highlight meaningful differences and similarities.""",
                    
                    user_prompt_template="""Compare: {query}

{context_section}

Provide a thorough comparison including:
- Overview of each item being compared
- Key similarities
- Important differences
- Strengths and weaknesses of each
- Contexts where each excels
- Recommendation for different scenarios
- Conclusion with clear insights

Structure with clear headings for easy comparison.""",
                    
                    response_format="analytical_text",
                    temperature=0.5,
                    max_tokens=2000,
                    examples=[]
                ),
                
                "groq": PromptTemplate(
                    system_prompt="""Provide clear, concise comparisons that help understand the key differences between options.""",
                    
                    user_prompt_template="""Compare: {query}

{context_section}

Focus on:
- Main differences
- Key similarities
- When to use each
- Quick recommendation

Keep it clear and easy to understand.""",
                    
                    response_format="text",
                    temperature=0.6,
                    max_tokens=1200,
                    examples=[]
                )
            },
            
            # PROBLEM SOLVING TEMPLATES
            "problem_solving": {
                "deepseek": PromptTemplate(
                    system_prompt="""You are an expert problem solver. Provide systematic, step-by-step solutions with clear reasoning and alternative approaches.""",
                    
                    user_prompt_template="""Solve this problem: {query}

{context_section}

Provide a comprehensive solution including:
1. Problem analysis and understanding
2. Required concepts or formulas
3. Step-by-step solution process
4. Verification of the answer
5. Alternative solution methods
6. Common mistakes to avoid
7. Similar problems for practice

Show all work and explain each step clearly.""",
                    
                    response_format="analytical_text",
                    temperature=0.3,
                    max_tokens=2500,
                    examples=[]
                ),
                
                "groq": PromptTemplate(
                    system_prompt="""Provide clear, step-by-step solutions to problems with explanations.""",
                    
                    user_prompt_template="""Solve: {query}

{context_section}

Show:
- Steps to solve
- Final answer
- Brief explanation

Keep it clear and easy to follow.""",
                    
                    response_format="text",
                    temperature=0.4,
                    max_tokens=1500,
                    examples=[]
                )
            }
        }
        
        return templates
    
    def get_template(self, intent: str, provider: str) -> PromptTemplate:
        """Get the appropriate template for intent and provider"""
        if intent not in self.templates:
            # Default to explanation template
            intent = "explanation"
        
        if provider not in self.templates[intent]:
            # Use first available provider
            provider = list(self.templates[intent].keys())[0]
        
        return self.templates[intent][provider]
    
    def format_prompt(self, template: PromptTemplate, query: str, 
                     context: str = "", **kwargs) -> Dict[str, Any]:
        """Format a prompt template with the given query and context"""
        
        # Build context section if provided
        context_section = ""
        if context:
            context_section = f"CONTEXT:\n{context}\n"
        
        # Format user prompt
        user_prompt = template.user_prompt_template.format(
            query=query,
            context_section=context_section,
            **kwargs
        )
        
        return {
            "system_prompt": template.system_prompt,
            "user_prompt": user_prompt,
            "temperature": template.temperature,
            "max_tokens": template.max_tokens,
            "response_format": template.response_format,
            "examples": template.examples
        }
    
    def get_conversation_messages(self, formatted_prompt: Dict[str, Any], 
                               conversation_history: List[Dict[str, str]] = None) -> List[Dict[str, str]]:
        """Convert formatted prompt to conversation messages format"""
        messages = []
        
        # Add system prompt
        if formatted_prompt["system_prompt"]:
            messages.append({"role": "system", "content": formatted_prompt["system_prompt"]})
        
        # Add conversation history (if provided)
        if conversation_history:
            messages.extend(conversation_history[:-1])  # Exclude last message as it's the current query
        
        # Add current user prompt
        messages.append({"role": "user", "content": formatted_prompt["user_prompt"]})
        
        return messages
    
    def validate_response_format(self, response: str, expected_format: str) -> Dict[str, Any]:
        """Validate and parse response format"""
        if expected_format == "json":
            try:
                # Try to extract JSON from response
                json_match = None
                for pattern in [r'\{.*\}', r'\[.*\]']:
                    import re
                    match = re.search(pattern, response, re.DOTALL)
                    if match:
                        json_match = match.group()
                        break
                
                if json_match:
                    parsed = json.loads(json_match)
                    return {"valid": True, "data": parsed, "raw": response}
                else:
                    return {"valid": False, "error": "No JSON found in response", "raw": response}
            except json.JSONDecodeError as e:
                return {"valid": False, "error": f"JSON parsing error: {str(e)}", "raw": response}
        
        else:
            # For text formats, always valid
            return {"valid": True, "data": response, "raw": response}
    
    def get_optimization_suggestions(self, intent: str, provider: str, 
                                  performance_metrics: Dict[str, float]) -> Dict[str, Any]:
        """Get suggestions for optimizing prompts based on performance"""
        template = self.get_template(intent, provider)
        
        suggestions = []
        
        # Temperature optimization
        avg_response_time = performance_metrics.get("avg_response_time", 0)
        if avg_response_time > 10.0 and template.temperature > 0.5:
            suggestions.append({
                "type": "temperature",
                "current": template.temperature,
                "suggested": template.temperature - 0.1,
                "reason": "Reduce temperature for faster responses"
            })
        
        # Token optimization
        avg_tokens = performance_metrics.get("avg_tokens", 0)
        if avg_tokens > template.max_tokens * 0.9:
            suggestions.append({
                "type": "max_tokens",
                "current": template.max_tokens,
                "suggested": int(template.max_tokens * 1.2),
                "reason": "Increase max tokens to avoid truncation"
            })
        
        return {
            "intent": intent,
            "provider": provider,
            "current_template": {
                "temperature": template.temperature,
                "max_tokens": template.max_tokens,
                "response_format": template.response_format
            },
            "suggestions": suggestions
        }
