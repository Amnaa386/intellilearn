import httpx
import google.generativeai as genai
import openai
from typing import Dict, List, Optional, Any
from .config import settings
import json
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.groq_client = httpx.Client()
        self.gemini_client = genai
        self.deepseek_client = openai
        
        # Initialize Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Initialize DeepSeek
        self.deepseek_client.api_key = settings.DEEPSEEK_API_KEY
        self.deepseek_client.base_url = "https://api.deepseek.com/v1"
        
        # Check if mock AI should be used
        self.use_mock_ai = getattr(settings, 'USE_MOCK_AI', 'false').lower() == 'true'
        logger.info(f"Mock AI enabled: {self.use_mock_ai}")

    def get_mock_response(self, messages: List[Dict[str, str]], intent_type: str = "explanation") -> str:
        """Generate mock AI responses for testing without API keys"""
        logger.info("Using mock AI response")
        
        user_message = messages[-1]["content"] if messages else "Hello"
        user_message_lower = user_message.lower()
        
        # Generate contextual mock responses based on intent and message content
        if "explain" in user_message_lower or "what is" in user_message_lower:
            if "photosynthesis" in user_message_lower:
                return """Photosynthesis is the process by which plants convert light energy into chemical energy. 

Here's how it works:
1. **Light Absorption**: Chlorophyll in leaves captures sunlight
2. **Water Uptake**: Roots absorb water from the soil
3. **Carbon Dioxide**: Leaves take in CO2 from the air
4. **Chemical Reaction**: Using light energy, plants convert CO2 and water into glucose (sugar) and oxygen
5. **Energy Storage**: The glucose provides energy for the plant's growth

The overall chemical equation is: 6CO2 + 6H2O + light energy = C6H12O6 + 6O2

This process is essential for life on Earth as it produces the oxygen we breathe and forms the base of most food chains."""
            elif "python" in user_message_lower:
                return """Python is a high-level, interpreted programming language known for its simplicity and readability.

Key features of Python:
- **Easy to Learn**: Clean, readable syntax
- **Versatile**: Used for web development, data science, AI, automation, and more
- **Large Community**: Extensive libraries and frameworks
- **Cross-Platform**: Runs on Windows, Mac, and Linux
- **Object-Oriented**: Supports OOP programming concepts

Common uses include:
- Web development (Django, Flask)
- Data analysis (Pandas, NumPy)
- Machine learning (TensorFlow, PyTorch)
- Automation scripts
- Scientific computing"""
            else:
                return f"""I'll explain {user_message.replace('explain ', '').replace('what is ', '').strip()} for you.

This is a mock response for testing purposes. In a real implementation, I would provide a detailed explanation based on the latest information available.

The explanation would include:
- Key concepts and definitions
- Important details and examples
- Practical applications
- Related topics for further learning

This demonstrates that the chat system is working correctly and would provide real AI responses when API keys are properly configured."""
        
        elif "notes" in user_message_lower or "study notes" in user_message_lower:
            return """# Study Notes

## Overview
This is a comprehensive study guide created to help you understand the topic better.

## Key Points
- **Main Concept**: Fundamental understanding of the subject
- **Important Details**: Specific information that's crucial to remember
- **Examples**: Practical applications and real-world scenarios

## Summary
- Review the main concepts regularly
- Practice with examples
- Connect with related topics

## Study Tips
1. Create flashcards for key terms
2. Practice explaining concepts to others
3. Use visual aids when possible
4. Take regular breaks while studying

*This is a mock study notes template for testing purposes.*"""
        
        elif "quiz" in user_message_lower or "test" in user_message_lower:
            return """# Quiz Questions

## Multiple Choice Questions

1. **Question 1**: What is the main purpose of this topic?
   A) Option A
   B) Option B  
   C) Option C
   D) Option D

2. **Question 2**: Which of the following is correct?
   A) Answer A
   B) Answer B
   C) Answer C
   D) Answer D

## Short Answer Questions

1. Explain the main concept in your own words.
2. Provide an example of how this applies in real life.

## True/False

1. Statement 1: True or False?
2. Statement 2: True or False?

## Answers
1. C) Option C
2. B) Answer B

*This is a mock quiz for testing purposes. Real quizzes would be generated based on the specific topic.*"""
        
        elif "ppt" in user_message_lower or "presentation" in user_message_lower:
            return """# Presentation Structure

## Slide 1: Title Slide
- **Title**: Main Topic
- **Subtitle**: Brief Description
- **Presenter**: Your Name

## Slide 2: Introduction
- **Overview**: What will be covered
- **Objectives**: Learning goals
- **Agenda**: Topics to discuss

## Slide 3: Main Content
- **Key Point 1**: Important information
- **Key Point 2**: Supporting details
- **Visual**: Diagram or chart

## Slide 4: Examples
- **Example 1**: Real-world application
- **Example 2**: Case study
- **Discussion**: Interactive elements

## Slide 5: Conclusion
- **Summary**: Key takeaways
- **Questions**: Q&A session
- **Resources**: Further reading

## Speaker Notes
- Detailed notes for each slide
- Talking points and timing
- Additional information to share

*This is a mock presentation structure for testing purposes.*"""
        
        else:
            return f"""Hello! I understand you're asking about: "{user_message}"

This is a mock AI response for testing purposes. The chat system is working correctly - it's able to:
- Receive your messages
- Process them through the intent detection system
- Generate appropriate responses based on the detected intent
- Format responses for different types of requests (explanations, notes, quizzes, presentations)

To get real AI responses, you'll need to:
1. Get API keys from Groq, Gemini, or DeepSeek
2. Add them to your .env file
3. Set USE_MOCK_AI=false

The system supports:
- **Explanations**: Detailed explanations of concepts
- **Study Notes**: Structured study materials
- **Quizzes**: Interactive questions and answers
- **Presentations**: Slide deck structures
- **Problem Solving**: Step-by-step solutions

Feel free to ask me anything, and I'll do my best to help with mock responses!"""

    async def groq_chat(self, messages: List[Dict[str, str]], model: str = "llama2-70b-4096") -> str:
        """Fast chat responses using Groq"""
        # Use mock response if enabled
        if self.use_mock_ai:
            return self.get_mock_response(messages, "explanation")
            
        logger.info("=== Groq Chat Debug Start ===")
        logger.info(f"Messages: {messages}")
        logger.info(f"Model: {model}")
        logger.info(f"Groq API Key exists: {bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY != 'your_groq_api_key_here')}")
        
        try:
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1024
            }
            
            logger.info(f"Groq Request Payload: {payload}")
            
            response = self.groq_client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            logger.info(f"Groq Response Status: {response.status_code}")
            logger.info(f"Groq Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Groq Response JSON: {result}")
                
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0]["message"]["content"]
                    logger.info(f"Groq Response Content: {content}")
                    logger.info("=== Groq Chat Debug End (Success) ===")
                    return content
                else:
                    logger.error("Groq response missing choices field")
                    return None
            else:
                logger.error(f"Groq API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Groq service error: {str(e)}")
            logger.error(f"Groq error type: {type(e)}")
            logger.error("=== Groq Chat Debug End (Error) ===")
            return None

    async def gemini_generate(self, prompt: str, generation_config: Optional[Dict] = None) -> str:
        """Structured outputs using Gemini"""
        # Use mock response if enabled
        if self.use_mock_ai:
            # Convert prompt to messages format for mock response
            mock_messages = [{"role": "user", "content": prompt}]
            return self.get_mock_response(mock_messages, "notes")
            
        try:
            model = self.gemini_client.GenerativeModel('gemini-pro')
            
            if generation_config:
                config = genai.types.GenerationConfig(**generation_config)
                response = model.generate_content(prompt, generation_config=config)
            else:
                response = model.generate_content(prompt)
            
            return response.text
            
        except Exception as e:
            logger.error(f"Gemini service error: {str(e)}")
            return None

    async def deepseek_chat(self, messages: List[Dict[str, str]], model: str = "deepseek-chat") -> str:
        """Fallback for complex queries using DeepSeek"""
        # Use mock response if enabled
        if self.use_mock_ai:
            return self.get_mock_response(messages, "explanation")
            
        try:
            response = self.deepseek_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=2048
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"DeepSeek service error: {str(e)}")
            return None

    async def get_chat_response(self, messages: List[Dict[str, str]], intent_type: str = "explanation") -> str:
        """Intelligent routing based on intent type"""
        
        logger.info("=== AI Service get_chat_response Debug Start ===")
        logger.info(f"Intent Type: {intent_type}")
        logger.info(f"Messages: {messages}")
        
        # Use Groq for fast explanations
        if intent_type == "explanation":
            logger.info("Using Groq for explanation")
            response = await self.groq_chat(messages)
            if response:
                logger.info(f"Groq response successful: {response[:100]}...")
                logger.info("=== AI Service get_chat_response Debug End (Success) ===")
                return response
            else:
                logger.warning("Groq response failed, trying fallback")
        
        # Use Gemini for structured content (notes, PPT, quiz)
        elif intent_type in ["notes", "ppt", "quiz"]:
            logger.info(f"Using Gemini for structured content: {intent_type}")
            prompt = self._format_structured_prompt(messages[-1]["content"], intent_type)
            logger.info(f"Structured prompt: {prompt[:200]}...")
            response = await self.gemini_generate(prompt)
            if response:
                logger.info(f"Gemini response successful: {response[:100]}...")
                logger.info("=== AI Service get_chat_response Debug End (Success) ===")
                return response
            else:
                logger.warning("Gemini response failed, trying fallback")
        
        # Use DeepSeek as fallback for complex queries
        logger.info("Using DeepSeek as fallback")
        response = await self.deepseek_chat(messages)
        if response:
            logger.info(f"DeepSeek response successful: {response[:100]}...")
            logger.info("=== AI Service get_chat_response Debug End (Success) ===")
            return response
        else:
            logger.warning("DeepSeek response failed, trying final fallback")
        
        # Final fallback to Groq
        logger.info("Using Groq as final fallback")
        response = await self.groq_chat(messages)
        if response:
            logger.info(f"Final Groq response successful: {response[:100]}...")
            logger.info("=== AI Service get_chat_response Debug End (Success) ===")
            return response
        else:
            logger.error("All AI providers failed")
            logger.info("=== AI Service get_chat_response Debug End (Error) ===")
            return None

    def _format_structured_prompt(self, user_input: str, intent_type: str) -> str:
        """Format prompt for structured content generation"""
        
        if intent_type == "notes":
            return f"""
            Generate comprehensive, well-structured study notes on: {user_input}
            
            Format the response as JSON with the following structure:
            {{
                "title": "Topic Title",
                "introduction": "Brief introduction",
                "key_points": [
                    {{
                        "heading": "Main Point 1",
                        "content": "Detailed explanation",
                        "sub_points": ["Sub point 1", "Sub point 2"]
                    }}
                ],
                "summary": "Concluding summary",
                "keywords": ["keyword1", "keyword2"]
            }}
            """
        
        elif intent_type == "ppt":
            return f"""
            Generate a PowerPoint presentation structure on: {user_input}
            
            Format the response as JSON with the following structure:
            {{
                "title": "Presentation Title",
                "slides": [
                    {{
                        "slide_number": 1,
                        "title": "Slide Title",
                        "content": "Main content points",
                        "speaker_notes": "Detailed speaker notes"
                    }}
                ]
            }}
            """
        
        elif intent_type == "quiz":
            return f"""
            Generate a multiple-choice quiz on: {user_input}
            
            Format the response as JSON with the following structure:
            {{
                "title": "Quiz Title",
                "questions": [
                    {{
                        "question": "Question text",
                        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                        "correct_answer": "A) Option 1",
                        "explanation": "Why this is correct"
                    }}
                ]
            }}
            """
        
        return user_input
