from openai import AsyncOpenAI
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
from app.core.config import settings
from app.core.redis import set_cache, get_cache
import json
import hashlib
import httpx
import ast
import re

logger = logging.getLogger(__name__)


class AIRateLimitError(RuntimeError):
    """Raised when configured AI provider is temporarily rate-limited."""
    pass

class AIService:
    def __init__(self):
        self.has_groq = bool(settings.GROQ_API_KEY)
        self.has_openai = bool(settings.OPENAI_API_KEY)
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if self.has_openai else None

        if not self.has_openai and not self.has_groq:
            logger.warning("OpenAI API key not configured")
        
        if self.has_groq:
            logger.info("AI provider priority: Groq -> OpenAI fallback")
        elif self.has_openai:
            logger.info("AI provider: OpenAI")
        else:
            logger.warning("No AI provider key configured (Groq/OpenAI)")

    async def _chat_completion(
        self,
        messages: List[Dict[str, Any]],
        max_tokens: int = 1000,
        temperature: float = 0.7,
        model_override: Optional[str] = None,
    ):
        """Call Groq first (free-friendly), fallback to OpenAI."""
        if self.has_groq:
            try:
                # Keep request lighter for free-tier TPM limits.
                effective_messages = messages[-8:] if len(messages) > 8 else messages
                safe_max_tokens = min(max_tokens, 600)
                selected_model = model_override or settings.GROQ_MODEL
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": selected_model,
                            "messages": effective_messages,
                            "max_tokens": safe_max_tokens,
                            "temperature": temperature,
                        },
                    )
                if resp.status_code >= 400:
                    if resp.status_code == 429:
                        raise AIRateLimitError("Groq rate limit reached. Please retry in a few seconds.")
                    raise RuntimeError(f"Groq error {resp.status_code}: {resp.text}")
                return "groq", resp.json()
            except Exception as e:
                # User preference: when Groq is configured, keep provider strict to Groq only.
                logger.error(f"Groq request failed: {e}")
                raise

        if self.has_openai:
            if model_override:
                logger.warning("Vision model override requested, but OpenAI fallback path is text-only.")
            response = await self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                presence_penalty=0.1,
                frequency_penalty=0.1,
            )
            return "openai", response

        if self.has_groq and not self.has_openai:
            raise AIRateLimitError("AI is temporarily busy due to rate limits. Please retry in 3-5 seconds.")
        raise RuntimeError("No AI provider configured. Set GROQ_API_KEY or OPENAI_API_KEY.")

    @staticmethod
    def _extract_content_and_usage(provider: str, response: Any):
        if provider == "groq":
            message = response["choices"][0]["message"]["content"]
            usage = response.get("usage", {})
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", prompt_tokens + completion_tokens)
            return message, prompt_tokens, completion_tokens, total_tokens

        message = response.choices[0].message.content
        usage = response.usage
        prompt_tokens = getattr(usage, "prompt_tokens", 0)
        completion_tokens = getattr(usage, "completion_tokens", 0)
        total_tokens = getattr(usage, "total_tokens", prompt_tokens + completion_tokens)
        return message, prompt_tokens, completion_tokens, total_tokens
    
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
            
            image_urls: List[str] = []
            if context and isinstance(context.get("image_urls"), list):
                image_urls = [u for u in context["image_urls"] if isinstance(u, str) and u.strip()]

            # Vision-capable path (Groq multimodal) when user sends images.
            if image_urls and self.has_groq:
                vision_content = [{"type": "text", "text": message}]
                for image_url in image_urls[:3]:
                    vision_content.append({"type": "image_url", "image_url": {"url": image_url}})

                vision_messages: List[Dict[str, Any]] = [messages[0]]
                if context and context.get("chat_history"):
                    vision_messages.extend(context["chat_history"])
                vision_messages.append({"role": "user", "content": vision_content})

                provider, response = await self._chat_completion(
                    vision_messages,
                    max_tokens=900,
                    temperature=0.5,
                    model_override=settings.GROQ_VISION_MODEL,
                )
            else:
                provider, response = await self._chat_completion(messages, max_tokens=1000, temperature=0.7)
            
            ai_message, prompt_tokens, completion_tokens, total_tokens = self._extract_content_and_usage(provider, response)
            
            result = {
                "message": ai_message,
                "usage": {
                    "provider": provider,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens
                },
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
            
            provider, response = await self._chat_completion(
                messages,
                max_tokens=2000 if complexity == "detailed" else 800,
                temperature=0.3,
            )
            content, prompt_tokens, completion_tokens, total_tokens = self._extract_content_and_usage(provider, response)
            
            result = {
                "title": f"Study Notes: {topic}",
                "content": content,
                "type": complexity,
                "generatedAt": datetime.utcnow().isoformat(),
                "usage": {
                    "provider": provider,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens
                }
            }
            
            # Cache the result
            await set_cache(cache_key, result, 7200)  # Cache for 2 hours
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating notes: {e}")
            raise
    
    async def generate_quiz(
        self,
        topic: str,
        question_count: int = 5,
        difficulty: str = "medium",
        question_types: List[str] = ["mcq"],
        content_context: Optional[str] = None,
        cache_scope: Optional[str] = None,
        use_cache: bool = True,
    ) -> Dict[str, Any]:
        """Generate AI quiz questions"""
        try:
            context_hash = hashlib.md5((content_context or "").encode()).hexdigest()[:10]
            scoped = cache_scope or "default"
            cache_key = f"quiz:{hashlib.md5(f'{topic}_{question_count}_{difficulty}_{"".join(question_types)}_{scoped}_{context_hash}'.encode()).hexdigest()}"
            
            # Try cache first
            if use_cache:
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
                "Language: English only",
                "Format as JSON with the following structure:",
                '{"questions": [{"id": "q1", "type": "mcq", "question": "...", "options": ["...", "...", "...", "..."], "correct": 0, "explanation": "..."}]}',
                "Ensure all questions are clear, accurate, and NON-REPETITIVE",
                "Do not repeat the same question stem across items"
            ])
            if content_context:
                prompt_parts.extend([
                    "Use this chat/note context as the source of truth for question ideas:",
                    str(content_context)[:1800],
                    "Avoid creating multiple questions that test the exact same fact.",
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
            
            provider, response = await self._chat_completion(messages, max_tokens=1500, temperature=0.4)
            content, prompt_tokens, completion_tokens, total_tokens = self._extract_content_and_usage(provider, response)
            
            # Parse JSON response robustly (Groq/OpenAI may include markdown fences or minor JSON issues)
            quiz_data = await self._parse_quiz_json_or_raise(content)
            normalized_questions = self._normalize_questions(
                quiz_data.get("questions", []),
                topic=topic,
                question_count=question_count,
                question_types=question_types,
            )
            desired_count = max(1, min(int(question_count or 5), 20))

            # If model returns too few valid/unique questions, request only missing ones (no deterministic fallback).
            retries = 0
            while len(normalized_questions) < desired_count and retries < 2:
                missing = desired_count - len(normalized_questions)
                extra_raw = await self._generate_additional_quiz_questions(
                    topic=topic,
                    difficulty=difficulty,
                    question_types=question_types,
                    missing_count=missing,
                    existing_questions=normalized_questions,
                )
                merged = normalized_questions + extra_raw
                normalized_questions = self._normalize_questions(
                    merged,
                    topic=topic,
                    question_count=question_count,
                    question_types=question_types,
                )
                retries += 1

            if len(normalized_questions) < desired_count:
                raise ValueError("AI returned insufficient valid quiz questions. Please regenerate.")

            quiz_data["questions"] = normalized_questions
            
            result = {
                "questions": quiz_data.get("questions", []),
                "title": f"Quiz: {topic}",
                "difficulty": difficulty,
                "questionCount": len(quiz_data.get("questions", [])),
                "generatedAt": datetime.utcnow().isoformat(),
                "usage": {
                    "provider": provider,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens
                }
            }
            
            # Cache the result
            if use_cache:
                await set_cache(cache_key, result, 3600)  # Cache for 1 hour
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            raise

    def _safe_parse_json_object(self, raw: str) -> Dict[str, Any]:
        """Parse first JSON object from model text with light repair."""
        if not raw:
            return {}
        text = str(raw).strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:].strip()
        parsed = self._coerce_quiz_payload(text)
        if parsed:
            return parsed

        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            list_start = text.find("[")
            list_end = text.rfind("]")
            if list_start != -1 and list_end != -1 and list_end > list_start:
                list_candidate = text[list_start:list_end + 1]
                parsed_list = self._coerce_quiz_payload(list_candidate)
                return parsed_list if parsed_list else {}
            return {}

        candidate = text[start:end + 1]
        parsed_candidate = self._coerce_quiz_payload(candidate)
        if parsed_candidate:
            return parsed_candidate

        # minimal JSON repair: remove trailing commas before closing braces/brackets
        repaired = re.sub(r",\s*([}\]])", r"\1", candidate)
        repaired_parsed = self._coerce_quiz_payload(repaired)
        return repaired_parsed if repaired_parsed else {}

    def _coerce_quiz_payload(self, text: str) -> Dict[str, Any]:
        """Coerce model output into {'questions': [...]} when possible."""
        if not text:
            return {}

        def _convert_loaded(loaded: Any) -> Dict[str, Any]:
            if isinstance(loaded, dict):
                questions = loaded.get("questions")
                if isinstance(questions, list):
                    return loaded
                return {}
            if isinstance(loaded, list):
                return {"questions": loaded}
            return {}

        for parser in (json.loads, ast.literal_eval):
            try:
                loaded = parser(text)
                converted = _convert_loaded(loaded)
                if converted:
                    return converted
            except Exception:
                continue
        return {}

    async def _parse_quiz_json_or_raise(self, raw: str) -> Dict[str, Any]:
        """Parse quiz JSON; if broken, ask model to repair into strict JSON."""
        parsed = self._safe_parse_json_object(raw)
        if isinstance(parsed.get("questions"), list) and parsed.get("questions"):
            return parsed

        repair_messages = [
            {
                "role": "system",
                "content": (
                    "You repair malformed JSON. Return ONLY valid JSON object with key 'questions'. "
                    "No markdown, no prose."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Fix this malformed quiz output into strict JSON.\n\n"
                    "Required format:\n"
                    "{\"questions\": [{\"id\":\"q1\",\"type\":\"mcq\",\"question\":\"...\","
                    "\"options\":[\"...\",\"...\",\"...\",\"...\"],\"correct\":0,\"explanation\":\"...\"}]}\n\n"
                    f"Malformed output:\n{str(raw)[:7000]}"
                ),
            },
        ]
        provider, repaired_response = await self._chat_completion(
            repair_messages,
            max_tokens=1800,
            temperature=0.0,
        )
        repaired_text, _, _, _ = self._extract_content_and_usage(provider, repaired_response)
        repaired = self._safe_parse_json_object(repaired_text)
        if isinstance(repaired.get("questions"), list) and repaired.get("questions"):
            return repaired
        raise ValueError("Failed to parse valid quiz JSON from AI response.")

    async def _generate_additional_quiz_questions(
        self,
        topic: str,
        difficulty: str,
        question_types: List[str],
        missing_count: int,
        existing_questions: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        existing_stems = [str(q.get("question", "")).strip() for q in existing_questions if q.get("question")]
        types_text = ", ".join(question_types) if question_types else "mcq"
        prompt = (
            f"Generate exactly {missing_count} additional UNIQUE quiz questions in English on topic: {topic}.\n"
            f"Difficulty: {difficulty}\n"
            f"Allowed types: {types_text}\n"
            "Return ONLY JSON object with key 'questions'.\n"
            "Do NOT repeat or paraphrase these existing question stems:\n"
            + "\n".join([f"- {s}" for s in existing_stems[:20]])
            + "\n\nJSON format:\n"
            "{\"questions\": [{\"id\":\"qX\",\"type\":\"mcq\",\"question\":\"...\","
            "\"options\":[\"...\",\"...\",\"...\",\"...\"],\"correct\":0,\"explanation\":\"...\"}]}"
        )
        messages = [
            {"role": "system", "content": "You are an expert quiz generator. Return strict JSON only."},
            {"role": "user", "content": prompt},
        ]
        provider, response = await self._chat_completion(messages, max_tokens=1300, temperature=0.2)
        text, _, _, _ = self._extract_content_and_usage(provider, response)
        parsed = await self._parse_quiz_json_or_raise(text)
        return parsed.get("questions", [])

    def _normalize_questions(
        self,
        questions: List[Dict[str, Any]],
        topic: str,
        question_count: int,
        question_types: List[str],
    ) -> List[Dict[str, Any]]:
        """Ensure quiz questions are valid, unique, and complete."""
        desired_count = max(1, min(int(question_count or 5), 20))
        normalized: List[Dict[str, Any]] = []
        seen = set()

        for idx, q in enumerate(questions):
            if not isinstance(q, dict):
                continue
            qtype = str(q.get("type") or "mcq").lower()
            if qtype not in {"mcq", "written", "true_false"}:
                qtype = "mcq"
            text = str(q.get("question") or "").strip()
            if not text:
                continue
            dedupe_key = text.lower()
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)

            row = {
                "id": q.get("id") or f"q{len(normalized) + 1}",
                "type": qtype,
                "question": text,
            }

            if qtype == "mcq":
                options = q.get("options") if isinstance(q.get("options"), list) else []
                options = [str(opt).strip() for opt in options if str(opt).strip()]
                if len(options) < 4:
                    options = [
                        f"It represents a core idea in {topic}.",
                        f"It is unrelated to {topic}.",
                        "It has no practical use.",
                        "It cannot be defined clearly.",
                    ]
                row["options"] = options[:4]
                correct = q.get("correct", 0)
                row["correct"] = int(correct) if isinstance(correct, int) and 0 <= int(correct) <= 3 else 0
                row["explanation"] = str(q.get("explanation") or f"{topic} involves key principles and applications.")
            elif qtype == "written":
                row["minLength"] = int(q.get("minLength") or 50)
                row["hintPool"] = q.get("hintPool") if isinstance(q.get("hintPool"), list) else []
            else:
                row["correct_bool"] = bool(q.get("correct_bool", True))
                row["explanation"] = str(q.get("explanation") or "")

            normalized.append(row)
            if len(normalized) >= desired_count:
                break

        return normalized
    
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
            
            provider, response = await self._chat_completion(messages, max_tokens=500, temperature=0.5)
            explanation, prompt_tokens, completion_tokens, total_tokens = self._extract_content_and_usage(provider, response)
            
            result = {
                "explanation": explanation,
                "slideNumber": slide_number,
                "keyPoints": self._extract_key_points(explanation),
                "usage": {
                    "provider": provider,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens
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
            
            provider, response = await self._chat_completion(
                messages,
                max_tokens=word_count * 2,
                temperature=0.6
            )
            script, prompt_tokens, completion_tokens, total_tokens = self._extract_content_and_usage(provider, response)
            
            result = {
                "script": script,
                "topic": topic,
                "duration": duration,
                "style": style,
                "estimatedWordCount": len(script.split()),
                "usage": {
                    "provider": provider,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens
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
            
            provider, response = await self._chat_completion(messages, max_tokens=500, temperature=0.3)
            evaluation_text, _, _, _ = self._extract_content_and_usage(provider, response)
            
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
