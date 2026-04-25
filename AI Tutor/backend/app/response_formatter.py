import json
import re
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ResponseType(Enum):
    TEXT = "text"
    STRUCTURED_JSON = "structured_json"
    MARKDOWN = "markdown"
    MIXED = "mixed"

class ContentType(Enum):
    EXPLANATION = "explanation"
    NOTES = "notes"
    QUIZ = "quiz"
    PPT = "ppt"
    COMPARISON = "comparison"
    PROBLEM_SOLUTION = "problem_solution"
    SUMMARY = "summary"

@dataclass
class FormattedResponse:
    """Standardized response format"""
    content: str
    content_type: ContentType
    response_type: ResponseType
    metadata: Dict[str, Any]
    structured_data: Optional[Dict[str, Any]] = None
    display_format: Optional[str] = None
    confidence_score: Optional[float] = None
    processing_time: Optional[float] = None
    token_usage: Optional[Dict[str, int]] = None
    provider_used: Optional[str] = None
    intent_detected: Optional[str] = None
    error_info: Optional[Dict[str, Any]] = None

@dataclass
class ResponseValidation:
    """Response validation result"""
    is_valid: bool
    validation_errors: List[str]
    warnings: List[str]
    suggestions: List[str]

class ResponseFormatter:
    def __init__(self):
        self.content_formatters = {
            ContentType.NOTES: self._format_notes_response,
            ContentType.QUIZ: self._format_quiz_response,
            ContentType.PPT: self._format_ppt_response,
            ContentType.EXPLANATION: self._format_explanation_response,
            ContentType.COMPARISON: self._format_comparison_response,
            ContentType.PROBLEM_SOLUTION: self._format_problem_solution_response,
            ContentType.SUMMARY: self._format_summary_response
        }
    
    def format_response(self, raw_response: str, content_type: ContentType, 
                       metadata: Dict[str, Any] = None) -> FormattedResponse:
        """Main response formatting method"""
        
        start_time = datetime.now()
        
        try:
            # Detect response type
            response_type = self._detect_response_type(raw_response)
            
            # Extract structured data if present
            structured_data = None
            if response_type == ResponseType.STRUCTURED_JSON:
                structured_data = self._extract_structured_data(raw_response)
            
            # Format content based on type
            formatted_content = self._format_content(raw_response, content_type, response_type)
            
            # Validate response
            validation = self._validate_response(formatted_content, content_type, structured_data)
            
            # Create formatted response
            formatted_response = FormattedResponse(
                content=formatted_content,
                content_type=content_type,
                response_type=response_type,
                metadata=metadata or {},
                structured_data=structured_data,
                display_format=self._get_display_format(content_type),
                confidence_score=self._calculate_confidence_score(validation),
                processing_time=(datetime.now() - start_time).total_seconds(),
                token_usage=metadata.get("token_usage") if metadata else None,
                provider_used=metadata.get("provider") if metadata else None,
                intent_detected=metadata.get("intent") if metadata else None,
                error_info={"validation_errors": validation.validation_errors} if not validation.is_valid else None
            )
            
            return formatted_response
            
        except Exception as e:
            logger.error(f"Response formatting failed: {str(e)}")
            return FormattedResponse(
                content=raw_response,
                content_type=content_type,
                response_type=ResponseType.TEXT,
                metadata=metadata or {},
                error_info={"formatting_error": str(e)}
            )
    
    def _detect_response_type(self, response: str) -> ResponseType:
        """Detect the type of response"""
        response_lower = response.lower().strip()
        
        # Check for JSON structure
        if (response_lower.startswith('{') and response_lower.endswith('}')) or \
           (response_lower.startswith('[') and response_lower.endswith(']')):
            return ResponseType.STRUCTURED_JSON
        
        # Check for markdown indicators
        markdown_patterns = [
            r'^#+\s',  # Headers
            r'\*\*.*?\*\*',  # Bold
            r'\*.*?\*',  # Italics
            r'^\s*[-*+]\s',  # Lists
            r'^\s*\d+\.\s',  # Numbered lists
            r'```',  # Code blocks
            r'\[.*\]\(.*\)'  # Links
        ]
        
        for pattern in markdown_patterns:
            if re.search(pattern, response, re.MULTILINE):
                return ResponseType.MARKDOWN
        
        # Check for mixed content (JSON + text)
        if '{' in response and '}' in response and not response.strip().startswith('{'):
            return ResponseType.MIXED
        
        return ResponseType.TEXT
    
    def _extract_structured_data(self, response: str) -> Optional[Dict[str, Any]]:
        """Extract and parse JSON data from response"""
        try:
            # Try to find JSON in the response
            json_patterns = [
                r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}',  # Nested objects
                r'\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]',  # Nested arrays
                r'\{.*\}',  # Simple object
                r'\[.*\]'  # Simple array
            ]
            
            for pattern in json_patterns:
                matches = re.findall(pattern, response, re.DOTALL)
                for match in matches:
                    try:
                        parsed = json.loads(match)
                        return parsed
                    except json.JSONDecodeError:
                        continue
            
            return None
            
        except Exception as e:
            logger.error(f"JSON extraction failed: {str(e)}")
            return None
    
    def _format_content(self, raw_response: str, content_type: ContentType, 
                       response_type: ResponseType) -> str:
        """Format content based on type"""
        
        # Use specific formatter if available
        if content_type in self.content_formatters:
            return self.content_formatters[content_type](raw_response, response_type)
        
        # Default formatting
        return self._format_generic_response(raw_response, response_type)
    
    def _format_notes_response(self, raw_response: str, response_type: ResponseType) -> str:
        """Format notes response for display"""
        
        if response_type == ResponseType.STRUCTURED_JSON:
            structured_data = self._extract_structured_data(raw_response)
            if structured_data:
                return self._format_structured_notes(structured_data)
        
        # Format as markdown
        lines = raw_response.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Convert common patterns to markdown
            if line.lower().startswith(('title:', 'topic:')):
                formatted_lines.append(f"## {line.split(':', 1)[1].strip()}")
            elif line.lower().startswith(('introduction:', 'overview:')):
                formatted_lines.append(f"### {line.split(':', 1)[0].strip()}")
                formatted_lines.append(line.split(':', 1)[1].strip())
            elif any(keyword in line.lower() for keyword in ['key points', 'main points', 'summary']):
                formatted_lines.append(f"### {line}")
            elif line.startswith(('-', '*', '1.', '2.', '3.')):
                formatted_lines.append(f"  {line}")
            else:
                formatted_lines.append(line)
        
        return '\n\n'.join(formatted_lines)
    
    def _format_quiz_response(self, raw_response: str, response_type: ResponseType) -> str:
        """Format quiz response for display"""
        
        if response_type == ResponseType.STRUCTURED_JSON:
            structured_data = self._extract_structured_data(raw_response)
            if structured_data:
                return self._format_structured_quiz(structured_data)
        
        # Generic quiz formatting
        return self._format_generic_response(raw_response, response_type)
    
    def _format_ppt_response(self, raw_response: str, response_type: ResponseType) -> str:
        """Format presentation response for display"""
        
        if response_type == ResponseType.STRUCTURED_JSON:
            structured_data = self._extract_structured_data(raw_response)
            if structured_data:
                return self._format_structured_ppt(structured_data)
        
        # Generic PPT formatting
        return self._format_generic_response(raw_response, response_type)
    
    def _format_explanation_response(self, raw_response: str, response_type: ResponseType) -> str:
        """Format explanation response for display"""
        
        # Clean up and format explanation
        lines = raw_response.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if line:
                formatted_lines.append(line)
        
        return '\n\n'.join(formatted_lines)
    
    def _format_comparison_response(self, raw_response: str, response_type: ResponseType) -> str:
        """Format comparison response for display"""
        
        # Enhance comparison formatting
        if 'vs' in raw_response or 'versus' in raw_response.lower():
            lines = raw_response.split('\n')
            formatted_lines = []
            
            for line in lines:
                line = line.strip()
                if line:
                    formatted_lines.append(line)
            
            return '\n\n'.join(formatted_lines)
        
        return self._format_generic_response(raw_response, response_type)
    
    def _format_problem_solution_response(self, raw_response: str, response_type: ResponseType) -> str:
        """Format problem solution response for display"""
        
        # Format step-by-step solutions
        lines = raw_response.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if line:
                # Highlight step indicators
                if re.match(r'^\d+\.|step\s+\d+|solution:', line, re.IGNORECASE):
                    formatted_lines.append(f"**{line}**")
                else:
                    formatted_lines.append(line)
        
        return '\n\n'.join(formatted_lines)
    
    def _format_summary_response(self, raw_response: str, response_type: ResponseType) -> str:
        """Format summary response for display"""
        
        # Clean up summary formatting
        lines = raw_response.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if line:
                formatted_lines.append(line)
        
        return '\n\n'.join(formatted_lines)
    
    def _format_generic_response(self, raw_response: str, response_type: ResponseType) -> str:
        """Generic response formatting"""
        
        if response_type == ResponseType.MARKDOWN:
            return raw_response  # Already in markdown format
        
        # Convert to markdown
        lines = raw_response.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if line:
                formatted_lines.append(line)
        
        return '\n\n'.join(formatted_lines)
    
    def _format_structured_notes(self, data: Dict[str, Any]) -> str:
        """Format structured notes data"""
        
        content = []
        
        if 'title' in data:
            content.append(f"# {data['title']}")
        
        if 'introduction' in data:
            content.append(f"## Introduction\n{data['introduction']}")
        
        if 'key_concepts' in data:
            content.append("## Key Concepts")
            for concept in data['key_concepts']:
                if isinstance(concept, dict):
                    content.append(f"### {concept.get('concept', concept.get('name', 'Concept'))}")
                    if 'definition' in concept:
                        content.append(f"**Definition:** {concept['definition']}")
                    if 'example' in concept:
                        content.append(f"**Example:** {concept['example']}")
                else:
                    content.append(f"- {concept}")
        
        if 'detailed_points' in data:
            content.append("## Detailed Points")
            for point in data['detailed_points']:
                if isinstance(point, dict):
                    content.append(f"### {point.get('heading', 'Point')}")
                    content.append(point.get('content', ''))
                    if 'sub_points' in point:
                        for sub_point in point['sub_points']:
                            content.append(f"- {sub_point}")
                else:
                    content.append(f"- {point}")
        
        if 'summary' in data:
            content.append(f"## Summary\n{data['summary']}")
        
        return '\n\n'.join(content)
    
    def _format_structured_quiz(self, data: Dict[str, Any]) -> str:
        """Format structured quiz data"""
        
        content = []
        
        if 'quiz_title' in data:
            content.append(f"# {data['quiz_title']}")
        
        if 'instructions' in data:
            content.append(f"**Instructions:** {data['instructions']}")
        
        if 'questions' in data:
            for i, question in enumerate(data['questions'], 1):
                content.append(f"## Question {i}")
                
                if isinstance(question, dict):
                    content.append(question.get('question', ''))
                    
                    if 'options' in question:
                        for option in question['options']:
                            content.append(f"- {option}")
                    
                    if 'correct_answer' in question:
                        content.append(f"**Correct Answer:** {question['correct_answer']}")
                    
                    if 'explanation' in question:
                        content.append(f"**Explanation:** {question['explanation']}")
                else:
                    content.append(str(question))
                
                content.append("")  # Spacing
        
        return '\n'.join(content)
    
    def _format_structured_ppt(self, data: Dict[str, Any]) -> str:
        """Format structured presentation data"""
        
        content = []
        
        if 'presentation_title' in data:
            content.append(f"# {data['presentation_title']}")
        
        if 'learning_objectives' in data:
            content.append("## Learning Objectives")
            for objective in data['learning_objectives']:
                content.append(f"- {objective}")
        
        if 'slides' in data:
            for slide in data['slides']:
                if isinstance(slide, dict):
                    content.append(f"## Slide {slide.get('slide_number', '')}: {slide.get('title', '')}")
                    content.append(slide.get('content', ''))
                    
                    if 'speaker_notes' in slide:
                        content.append(f"**Speaker Notes:** {slide['speaker_notes']}")
                else:
                    content.append(f"## {slide}")
                
                content.append("")  # Spacing
        
        return '\n'.join(content)
    
    def _get_display_format(self, content_type: ContentType) -> str:
        """Get the recommended display format for content type"""
        
        format_mapping = {
            ContentType.NOTES: "markdown",
            ContentType.QUIZ: "structured",
            ContentType.PPT: "structured",
            ContentType.EXPLANATION: "markdown",
            ContentType.COMPARISON: "markdown",
            ContentType.PROBLEM_SOLUTION: "markdown",
            ContentType.SUMMARY: "markdown"
        }
        
        return format_mapping.get(content_type, "text")
    
    def _validate_response(self, content: str, content_type: ContentType, 
                          structured_data: Optional[Dict[str, Any]]) -> ResponseValidation:
        """Validate the formatted response"""
        
        errors = []
        warnings = []
        suggestions = []
        
        # Basic content validation
        if not content or len(content.strip()) < 10:
            errors.append("Response content is too short or empty")
        
        # Structured data validation
        if structured_data:
            validation_result = self._validate_structured_data(structured_data, content_type)
            errors.extend(validation_result["errors"])
            warnings.extend(validation_result["warnings"])
            suggestions.extend(validation_result["suggestions"])
        
        # Content type specific validation
        if content_type == ContentType.QUIZ and 'question' not in content.lower():
            warnings.append("Quiz response may not contain clear questions")
        
        if content_type == ContentType.NOTES and len(content) < 200:
            suggestions.append("Notes seem brief, consider adding more detail")
        
        return ResponseValidation(
            is_valid=len(errors) == 0,
            validation_errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )
    
    def _validate_structured_data(self, data: Dict[str, Any], content_type: ContentType) -> Dict[str, List[str]]:
        """Validate structured data based on content type"""
        
        errors = []
        warnings = []
        suggestions = []
        
        if content_type == ContentType.QUIZ:
            if 'questions' not in data:
                errors.append("Quiz data missing 'questions' field")
            elif not isinstance(data['questions'], list) or len(data['questions']) == 0:
                errors.append("Quiz 'questions' field must be a non-empty list")
        
        elif content_type == ContentType.NOTES:
            if 'title' not in data:
                warnings.append("Notes missing 'title' field")
            if 'key_points' not in data and 'detailed_points' not in data:
                suggestions.append("Consider adding key points or detailed points to notes")
        
        elif content_type == ContentType.PPT:
            if 'slides' not in data:
                errors.append("Presentation data missing 'slides' field")
            elif not isinstance(data['slides'], list) or len(data['slides']) < 3:
                suggestions.append("Presentations typically have at least 3 slides")
        
        return {
            "errors": errors,
            "warnings": warnings,
            "suggestions": suggestions
        }
    
    def _calculate_confidence_score(self, validation: ResponseValidation) -> float:
        """Calculate confidence score based on validation"""
        
        base_score = 0.8  # Start with high confidence
        
        # Reduce score based on errors
        error_penalty = len(validation.validation_errors) * 0.2
        warning_penalty = len(validation.warnings) * 0.05
        
        confidence = base_score - error_penalty - warning_penalty
        return max(0.0, min(1.0, confidence))
    
    def to_dict(self, response: FormattedResponse) -> Dict[str, Any]:
        """Convert formatted response to dictionary"""
        return asdict(response)
    
    def from_dict(self, data: Dict[str, Any]) -> FormattedResponse:
        """Create formatted response from dictionary"""
        # Convert string enums back to enums
        if 'content_type' in data and isinstance(data['content_type'], str):
            data['content_type'] = ContentType(data['content_type'])
        if 'response_type' in data and isinstance(data['response_type'], str):
            data['response_type'] = ResponseType(data['response_type'])
        
        return FormattedResponse(**data)
