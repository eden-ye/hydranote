"""Tests for prompt builder service."""
import pytest
from app.services.prompts import (
    PromptBuilder,
    PromptType,
    BlockContext,
)


class TestBlockContext:
    """Tests for BlockContext dataclass."""

    def test_create_minimal_context(self):
        """Context can be created with just text."""
        context = BlockContext(text="Test bullet")
        assert context.text == "Test bullet"
        assert context.parent_text is None
        assert context.sibling_texts == []

    def test_create_full_context(self):
        """Context can include parent and siblings."""
        context = BlockContext(
            text="Current bullet",
            parent_text="Parent context",
            sibling_texts=["Sibling 1", "Sibling 2"],
        )
        assert context.text == "Current bullet"
        assert context.parent_text == "Parent context"
        assert len(context.sibling_texts) == 2


class TestPromptBuilder:
    """Tests for PromptBuilder service."""

    @pytest.fixture
    def builder(self):
        """Create a prompt builder instance."""
        return PromptBuilder()

    def test_build_expand_bullet_prompt(self, builder):
        """Build prompt for expanding a single bullet."""
        context = BlockContext(text="Machine learning basics")
        prompt = builder.build(PromptType.EXPAND_BULLET, context)

        assert "Machine learning basics" in prompt
        assert "expand" in prompt.lower() or "elaborate" in prompt.lower()

    def test_build_generate_children_prompt(self, builder):
        """Build prompt for generating child bullets."""
        context = BlockContext(text="Project planning")
        prompt = builder.build(PromptType.GENERATE_CHILDREN, context)

        assert "Project planning" in prompt
        assert "children" in prompt.lower() or "sub" in prompt.lower()

    def test_includes_parent_context(self, builder):
        """Prompt includes parent context when provided."""
        context = BlockContext(
            text="Define requirements",
            parent_text="Project planning",
        )
        prompt = builder.build(PromptType.EXPAND_BULLET, context)

        assert "Project planning" in prompt
        assert "Define requirements" in prompt

    def test_includes_sibling_context(self, builder):
        """Prompt includes sibling context when provided."""
        context = BlockContext(
            text="Testing strategy",
            sibling_texts=["Design phase", "Implementation"],
        )
        prompt = builder.build(PromptType.EXPAND_BULLET, context)

        assert "Design phase" in prompt or "Implementation" in prompt

    def test_word_limit_guidance(self, builder):
        """Prompt includes word limit guidance."""
        context = BlockContext(text="AI concepts")
        prompt = builder.build(PromptType.EXPAND_BULLET, context)

        # Check for word limit guidance (around 20 words)
        assert "20" in prompt or "concise" in prompt.lower() or "brief" in prompt.lower()

    def test_json_output_format(self, builder):
        """Prompt requests JSON output format."""
        context = BlockContext(text="API design")
        prompt = builder.build(PromptType.GENERATE_CHILDREN, context)

        assert "json" in prompt.lower() or "JSON" in prompt

    def test_hierarchical_structure_template(self, builder):
        """Generate children prompt emphasizes hierarchy."""
        context = BlockContext(text="Software architecture")
        prompt = builder.build(PromptType.GENERATE_CHILDREN, context)

        # Should mention structure or hierarchy
        assert any(
            word in prompt.lower()
            for word in ["hierarchical", "structure", "nested", "children", "bullets"]
        )


class TestPromptBuilderSystemPrompts:
    """Tests for system prompt generation."""

    @pytest.fixture
    def builder(self):
        """Create a prompt builder instance."""
        return PromptBuilder()

    def test_get_system_prompt_expand(self, builder):
        """System prompt for expansion is appropriate."""
        system = builder.get_system_prompt(PromptType.EXPAND_BULLET)

        assert "note" in system.lower() or "bullet" in system.lower()
        assert len(system) > 20  # Should have meaningful content

    def test_get_system_prompt_generate(self, builder):
        """System prompt for generation is appropriate."""
        system = builder.get_system_prompt(PromptType.GENERATE_CHILDREN)

        assert "note" in system.lower() or "bullet" in system.lower()
        assert len(system) > 20


class TestPromptBuilderExamples:
    """Tests for example inclusion in prompts."""

    @pytest.fixture
    def builder(self):
        """Create a prompt builder instance."""
        return PromptBuilder()

    def test_expand_prompt_includes_example(self, builder):
        """Expand prompt includes an example of good output."""
        context = BlockContext(text="Test topic")
        prompt = builder.build(PromptType.EXPAND_BULLET, context)

        # Should include example format or demonstration
        assert "example" in prompt.lower() or "->" in prompt or ":" in prompt

    def test_generate_children_includes_example(self, builder):
        """Generate children prompt includes an example."""
        context = BlockContext(text="Test topic")
        prompt = builder.build(PromptType.GENERATE_CHILDREN, context)

        # Should include example or format specification
        assert "example" in prompt.lower() or "[" in prompt


class TestPromptBuilderEdgeCases:
    """Tests for edge cases and robustness."""

    @pytest.fixture
    def builder(self):
        """Create a prompt builder instance."""
        return PromptBuilder()

    def test_empty_text_context(self, builder):
        """Handle empty text gracefully."""
        context = BlockContext(text="")
        prompt = builder.build(PromptType.EXPAND_BULLET, context)

        # Should still produce a valid prompt
        assert len(prompt) > 0

    def test_very_long_text_context(self, builder):
        """Handle very long text input."""
        long_text = "Word " * 500
        context = BlockContext(text=long_text)
        prompt = builder.build(PromptType.EXPAND_BULLET, context)

        # Should include the text (possibly truncated)
        assert "Word" in prompt

    def test_special_characters_in_text(self, builder):
        """Handle special characters properly."""
        context = BlockContext(text="Test <script>alert('xss')</script>")
        prompt = builder.build(PromptType.EXPAND_BULLET, context)

        # Should handle without breaking
        assert "Test" in prompt

    def test_many_siblings(self, builder):
        """Handle many sibling contexts."""
        context = BlockContext(
            text="Current item",
            sibling_texts=[f"Sibling {i}" for i in range(20)],
        )
        prompt = builder.build(PromptType.EXPAND_BULLET, context)

        # Should include some siblings but not overwhelm
        assert "Current item" in prompt
