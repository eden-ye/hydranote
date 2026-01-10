"""Prompt builder service for constructing AI prompts."""
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class PromptType(Enum):
    """Types of prompts that can be built."""
    EXPAND_BULLET = "expand_bullet"
    GENERATE_CHILDREN = "generate_children"


@dataclass
class BlockContext:
    """Context for building prompts related to a block."""
    text: str
    parent_text: Optional[str] = None
    sibling_texts: list[str] = field(default_factory=list)


class PromptBuilder:
    """Service for constructing AI prompts for note generation."""

    # Maximum siblings to include in context to avoid overwhelming the prompt
    MAX_SIBLINGS = 5

    # Word limit guidance for generated content
    WORD_LIMIT = 20

    def __init__(self):
        """Initialize the prompt builder."""
        self._system_prompts = {
            PromptType.EXPAND_BULLET: self._expand_system_prompt(),
            PromptType.GENERATE_CHILDREN: self._generate_children_system_prompt(),
        }

    def _expand_system_prompt(self) -> str:
        """System prompt for expanding bullets."""
        return """You are a note-taking assistant that helps expand and elaborate on bullet points.
Your role is to take a brief note and expand it with more detail while keeping it concise.
Focus on adding relevant context, examples, or explanations that enhance understanding.
Always maintain a professional, informative tone suitable for personal knowledge management."""

    def _generate_children_system_prompt(self) -> str:
        """System prompt for generating child bullets."""
        return """You are a note-taking assistant that helps break down topics into structured sub-points.
Your role is to take a bullet point and generate relevant child bullets that elaborate on the topic.
Create a hierarchical structure that is logical and easy to understand.
Each child bullet should be a distinct sub-topic or aspect of the parent bullet."""

    def get_system_prompt(self, prompt_type: PromptType) -> str:
        """Get the system prompt for a given prompt type.

        Args:
            prompt_type: The type of prompt

        Returns:
            The system prompt string
        """
        return self._system_prompts.get(prompt_type, "")

    def build(self, prompt_type: PromptType, context: BlockContext) -> str:
        """Build a prompt based on type and context.

        Args:
            prompt_type: The type of prompt to build
            context: The block context including text, parent, siblings

        Returns:
            The constructed prompt string
        """
        if prompt_type == PromptType.EXPAND_BULLET:
            return self._build_expand_prompt(context)
        elif prompt_type == PromptType.GENERATE_CHILDREN:
            return self._build_generate_children_prompt(context)
        else:
            raise ValueError(f"Unknown prompt type: {prompt_type}")

    def _build_context_section(self, context: BlockContext) -> str:
        """Build the context section of a prompt.

        Args:
            context: The block context

        Returns:
            Context section string
        """
        parts = []

        if context.parent_text:
            parts.append(f"Parent context: \"{context.parent_text}\"")

        if context.sibling_texts:
            # Limit siblings to avoid overwhelming the prompt
            siblings = context.sibling_texts[:self.MAX_SIBLINGS]
            siblings_str = ", ".join(f"\"{s}\"" for s in siblings)
            parts.append(f"Sibling bullets: [{siblings_str}]")

        return "\n".join(parts) if parts else ""

    def _build_expand_prompt(self, context: BlockContext) -> str:
        """Build a prompt for expanding a single bullet.

        Args:
            context: The block context

        Returns:
            The expand prompt string
        """
        context_section = self._build_context_section(context)

        prompt = f"""Expand the following bullet point with more detail.

Bullet to expand: "{context.text}"
"""

        if context_section:
            prompt += f"""
Context:
{context_section}
"""

        prompt += f"""
Requirements:
- Keep the expansion concise (around {self.WORD_LIMIT} words)
- Add relevant details, examples, or explanations
- Maintain the original meaning and intent
- Be specific and informative

Example:
Input: "Machine learning basics"
Output -> "Machine learning is a subset of AI where algorithms learn patterns from data to make predictions without explicit programming"

Respond with ONLY the expanded text, no additional formatting or explanation."""

        return prompt

    def _build_generate_children_prompt(self, context: BlockContext) -> str:
        """Build a prompt for generating child bullets.

        Args:
            context: The block context

        Returns:
            The generate children prompt string
        """
        context_section = self._build_context_section(context)

        prompt = f"""Generate hierarchical child bullets for the following topic.

Topic: "{context.text}"
"""

        if context_section:
            prompt += f"""
Context:
{context_section}
"""

        prompt += f"""
Requirements:
- Generate 3-5 relevant sub-points as children
- Each bullet should be concise (around {self.WORD_LIMIT} words)
- Create a logical structure that breaks down the topic
- Make bullets specific and actionable when appropriate

Output Format:
Respond with a JSON array of strings, where each string is a child bullet.

Example:
Input: "Project planning"
Output: ["Define project scope and objectives", "Identify stakeholders and resources", "Create timeline with milestones", "Establish communication protocols"]

Respond with ONLY the JSON array, no additional text or formatting."""

        return prompt


# Singleton instance
_prompt_builder: Optional[PromptBuilder] = None


def get_prompt_builder() -> PromptBuilder:
    """Get or create the prompt builder singleton."""
    global _prompt_builder
    if _prompt_builder is None:
        _prompt_builder = PromptBuilder()
    return _prompt_builder
