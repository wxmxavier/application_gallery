"""
AI Classifier for RSIP Application Gallery

Uses Google Gemini to classify content according to RSIP platform taxonomy.
"""
import json
from typing import Any, Dict, Optional
import structlog
import google.generativeai as genai

from config import Config, get_config


logger = structlog.get_logger()


# RSIP-aligned classification prompt
CLASSIFICATION_PROMPT = """
Analyze this robotics content and classify it according to the RSIP platform taxonomy.

CONTENT:
Title: {title}
Description: {description}
Source: {source_name}
Media Type: {media_type}

CLASSIFY INTO:

1. APPLICATION_CATEGORY (choose exactly one):
   - industrial_automation: Factory, warehouse, manufacturing, logistics automation
   - service_robotics: Hospitality, healthcare, delivery, cleaning, assistance
   - surveillance_security: Patrol, monitoring, access control, inspection

2. TASK_TYPES (choose 1-3 most relevant from this list):
   Industrial: transportation, inspection, manipulation, palletizing, welding, assembly, quality_control, packaging
   Service: delivery_service, human_interaction, healthcare_assist, cleaning, reception
   Security: perimeter_patrol, threat_detection, access_monitoring

3. FUNCTIONAL_REQUIREMENTS (choose 1-5 most demonstrated):
   Navigation: autonomous_navigation, obstacle_avoidance, precision_positioning, slam, path_planning
   Manipulation: pick_and_place, bin_picking_3d, kitting_sorting, gripper_control
   Perception: object_detection, quality_inspection, thermal_inspection, 3d_scanning
   Interaction: hri_multimodal, voice_recognition, gesture_recognition, telepresence
   Safety: collision_avoidance, functional_safety, emergency_stop

4. ENVIRONMENT (all that apply):
   - setting: indoor | outdoor | mixed
   - human_presence: high_traffic | low_traffic | collaborative | none
   - floor_type: smooth | rough | multi_level
   - lighting: natural | artificial | variable | low_light

5. SCENE_TYPE (choose one if applicable):
   warehouse, manufacturing, retail, hospital, office, hotel, outdoor, laboratory, construction

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "application_category": "industrial_automation",
  "task_types": ["transportation", "inspection"],
  "functional_requirements": ["autonomous_navigation", "obstacle_avoidance"],
  "environment": {{
    "setting": "indoor",
    "human_presence": "low_traffic",
    "floor_type": "smooth",
    "lighting": "artificial"
  }},
  "scene_type": "warehouse",
  "relevance_score": 0.85,
  "confidence": {{
    "category": 0.9,
    "tasks": 0.8,
    "requirements": 0.7
  }},
  "summary": "One sentence describing the robotics application demonstrated"
}}

RULES:
- Only include tags that are clearly demonstrated in the content
- relevance_score should be 0.0-1.0 indicating how relevant this is to real-world robotics applications
- If content is not about robotics, set relevance_score below 0.3
- Be conservative - only tag what you can clearly identify
"""


class RSIPClassifier:
    """Classifies content according to RSIP platform taxonomy using Gemini"""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()

        # Configure Gemini
        genai.configure(api_key=self.config.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

        # Valid values for validation
        self.valid_categories = ["industrial_automation", "service_robotics", "surveillance_security"]
        self.valid_task_types = [
            "transportation", "inspection", "manipulation", "palletizing", "welding",
            "assembly", "quality_control", "packaging", "delivery_service",
            "human_interaction", "healthcare_assist", "cleaning", "reception",
            "perimeter_patrol", "threat_detection", "access_monitoring"
        ]
        self.valid_scene_types = [
            "warehouse", "manufacturing", "retail", "hospital", "office",
            "hotel", "outdoor", "laboratory", "construction"
        ]

    async def classify(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classify an item according to RSIP taxonomy.

        Args:
            item: Content item with title, description, source_name, media_type

        Returns:
            Classification result with RSIP taxonomy tags
        """
        try:
            # Build prompt
            prompt = CLASSIFICATION_PROMPT.format(
                title=item.get("title", "")[:500],
                description=item.get("description", "")[:1500],
                source_name=item.get("source_name", "Unknown"),
                media_type=item.get("media_type", "video")
            )

            # Call Gemini
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=1024,
                )
            )

            # Parse response
            result = self._parse_response(response.text)

            # Apply defaults from item if available
            if not result.get("application_category") and item.get("default_category"):
                result["application_category"] = item["default_category"]

            if not result.get("task_types") and item.get("default_tasks"):
                result["task_types"] = item["default_tasks"]

            # Validate and clean result
            result = self._validate_result(result)

            logger.debug("Classification complete",
                        title=item.get("title", "")[:50],
                        category=result.get("application_category"),
                        score=result.get("relevance_score"))

            return result

        except Exception as e:
            logger.error("Classification failed",
                        title=item.get("title", "")[:50],
                        error=str(e))

            # Return default classification on error
            return self._get_default_classification(item)

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse JSON response from Gemini"""
        # Clean up response
        text = response_text.strip()

        # Remove markdown code blocks if present
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning("Failed to parse JSON response", error=str(e), text=text[:200])
            return {}

    def _validate_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean classification result"""
        # Validate category
        if result.get("application_category") not in self.valid_categories:
            result["application_category"] = "industrial_automation"

        # Validate task types
        result["task_types"] = [
            t for t in result.get("task_types", [])
            if t in self.valid_task_types
        ][:3]  # Max 3 tasks

        # Validate scene type
        if result.get("scene_type") not in self.valid_scene_types:
            result["scene_type"] = None

        # Validate relevance score
        try:
            score = float(result.get("relevance_score", 0.5))
            result["relevance_score"] = max(0.0, min(1.0, score))
        except (TypeError, ValueError):
            result["relevance_score"] = 0.5

        # Ensure confidence is dict
        if not isinstance(result.get("confidence"), dict):
            result["confidence"] = {"category": 0.7, "tasks": 0.7, "requirements": 0.7}

        return result

    def _get_default_classification(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Get default classification when AI fails"""
        return {
            "application_category": item.get("default_category", "industrial_automation"),
            "task_types": item.get("default_tasks", []),
            "functional_requirements": [],
            "environment": {
                "setting": "indoor",
                "human_presence": "low_traffic"
            },
            "scene_type": None,
            "relevance_score": 0.5,
            "confidence": {
                "category": 0.3,
                "tasks": 0.3,
                "requirements": 0.3
            },
            "summary": f"Robotics content from {item.get('source_name', 'unknown source')}"
        }
