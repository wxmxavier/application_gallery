"""
AI Classifier V2 for RSIP Application Gallery

Uses Google Gemini to classify content with enhanced distinction between
real-world applications and tech demos.
"""
import json
from typing import Any, Dict, Optional
import structlog
import google.generativeai as genai

from config import Config, get_config


logger = structlog.get_logger()


# V2 Classification prompt - stricter about real applications vs demos
CLASSIFICATION_PROMPT_V2 = """
Analyze this robotics content and classify it for the RSIP Application Gallery.

CONTENT:
Title: {title}
Description: {description}
Source: {source_name}
Media Type: {media_type}

CLASSIFICATION TASKS:

1. CONTENT_TYPE (most important - choose one):
   - real_application: Robot deployed in actual business, solving real problems
   - pilot_poc: Trial deployment, proof of concept, evaluation phase
   - case_study: Documented deployment with results/metrics
   - tech_demo: Capability demonstration, trade show, lab demo, controlled environment
   - product_announcement: New product reveal, features showcase
   - tutorial: How-to, integration guide, training content

   INDICATORS for real_application:
   - Named customer or facility
   - Production environment visible (not a lab/showroom)
   - Multiple units working together
   - Integration with existing systems visible
   - Workers interacting naturally (not staged)

   INDICATORS for tech_demo:
   - Trade show booth visible
   - Lab/showroom environment
   - Narrator explaining features
   - "Demo", "showcase", "capability" in title
   - No business context
   - Robot performing tricks or dance moves
   - Controlled/staged environment

2. DEPLOYMENT_MATURITY:
   - production: Running in real operations, customer named
   - pilot: Limited/trial deployment
   - prototype: R&D, lab stage
   - concept: Simulation, rendering, future capability
   - unknown: Cannot determine

3. APPLICATION_CATEGORY (choose one):
   - industrial_automation: Factory, warehouse, manufacturing, logistics
   - service_robotics: Hospitality, healthcare, delivery, cleaning
   - surveillance_security: Patrol, monitoring, inspection, access control

4. SPECIFIC_TASKS (be specific, choose 1-3):
   Industrial: pallet_transport, tote_transport, cart_towing, dock_to_stock,
              machine_tending, assembly_insertion, case_palletizing, depalletizing,
              visual_inspection, weld_inspection, screw_driving, material_handling,
              bin_picking, kitting, quality_control, packaging, welding, painting
   Service: room_delivery, medication_delivery, food_delivery, floor_scrubbing,
           vacuum_cleaning, disinfection, reception_greeting, wayfinding,
           telepresence, inventory_scanning, companion, concierge
   Security: perimeter_patrol, intrusion_detection, access_verification,
            remote_monitoring, threat_detection, facility_inspection

5. SCENE_TYPE: warehouse, manufacturing, retail, hospital, office, hotel,
               outdoor, laboratory, construction, logistics_center, airport,
               restaurant, residential, campus

6. APPLICATION_CONTEXT:
   - problem_solved: What business problem? (labor_shortage, safety_hazard,
     quality_consistency, cost_reduction, throughput, 24x7_operation, hazardous_environment)
   - deployment_scale: single_unit | small_fleet | large_fleet | facility_wide | multi_site
   - customer_identified: true if specific company/facility named
   - has_metrics: true if ROI, efficiency numbers, or results mentioned

7. EDUCATIONAL_VALUE (1-5):
   5 = Full case study with metrics, integration details, lessons learned
   4 = Real deployment with good technical details visible
   3 = Real application but limited context
   2 = Demo with some application relevance
   1 = Pure marketing, entertainment, no practical value for users

8. FUNCTIONAL_REQUIREMENTS (capabilities demonstrated):
   Navigation: autonomous_navigation, obstacle_avoidance, slam, path_planning,
              fleet_management, multi_floor, outdoor_navigation
   Manipulation: pick_and_place, bin_picking_3d, force_control, vision_guided,
                gripper_control, dual_arm, high_precision
   Perception: object_detection, barcode_scanning, ai_inference, 3d_vision,
              defect_detection, ocr, thermal_imaging
   Safety: human_detection, safety_rated, collaborative, collision_avoidance,
          emergency_stop, zone_monitoring
   Integration: wms_integration, erp_integration, mes_integration, api_connectivity

Return ONLY valid JSON (no markdown):
{{
  "content_type": "real_application",
  "deployment_maturity": "production",
  "application_category": "industrial_automation",
  "specific_tasks": ["pallet_transport", "dock_to_stock"],
  "task_types": ["transportation"],
  "scene_type": "warehouse",
  "application_context": {{
    "problem_solved": "labor_shortage",
    "deployment_scale": "large_fleet",
    "customer_identified": true,
    "has_metrics": true
  }},
  "educational_value": 4,
  "functional_requirements": ["autonomous_navigation", "fleet_management", "wms_integration"],
  "environment": {{
    "setting": "indoor",
    "human_presence": "collaborative",
    "floor_type": "smooth",
    "lighting": "artificial"
  }},
  "summary": "Fleet of 50 AMRs handling pallet transport at BMW Leipzig plant, integrated with WMS for 24/7 operation",
  "relevance_score": 0.95
}}

CRITICAL RULES:
- Be STRICT about content_type. Most YouTube videos are tech_demo, not real_application
- real_application requires EVIDENCE of actual business deployment
- Trade show demos are ALWAYS tech_demo, even if impressive
- Lab/showroom/studio environments = tech_demo
- Robot dancing/doing tricks = tech_demo with educational_value 1
- If uncertain between real_application and tech_demo, choose tech_demo
- Relevance score should reflect practical value for someone planning a deployment
- educational_value 4-5 requires real deployment evidence
"""


class RSIPClassifier:
    """Classifies content according to RSIP platform taxonomy using Gemini V2"""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()

        # Configure Gemini
        genai.configure(api_key=self.config.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

        # Valid values for validation
        self.valid_content_types = [
            "real_application", "pilot_poc", "case_study",
            "tech_demo", "product_announcement", "tutorial", "unknown"
        ]
        self.valid_deployment_maturity = [
            "production", "pilot", "prototype", "concept", "unknown"
        ]
        self.valid_categories = [
            "industrial_automation", "service_robotics", "surveillance_security"
        ]
        self.valid_task_types = [
            # Legacy broad types (for backward compatibility)
            "transportation", "inspection", "manipulation", "palletizing", "welding",
            "assembly", "quality_control", "packaging", "delivery_service",
            "human_interaction", "healthcare_assist", "cleaning", "reception",
            "perimeter_patrol", "threat_detection", "access_monitoring"
        ]
        self.valid_specific_tasks = [
            # Industrial specific
            "pallet_transport", "tote_transport", "cart_towing", "dock_to_stock",
            "machine_tending", "assembly_insertion", "case_palletizing", "depalletizing",
            "visual_inspection", "weld_inspection", "screw_driving", "material_handling",
            "bin_picking", "kitting", "quality_control", "packaging", "welding", "painting",
            # Service specific
            "room_delivery", "medication_delivery", "food_delivery", "floor_scrubbing",
            "vacuum_cleaning", "disinfection", "reception_greeting", "wayfinding",
            "telepresence", "inventory_scanning", "companion", "concierge",
            # Security specific
            "perimeter_patrol", "intrusion_detection", "access_verification",
            "remote_monitoring", "threat_detection", "facility_inspection"
        ]
        self.valid_scene_types = [
            "warehouse", "manufacturing", "retail", "hospital", "office",
            "hotel", "outdoor", "laboratory", "construction", "logistics_center",
            "airport", "restaurant", "residential", "campus"
        ]

    async def classify(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classify an item according to RSIP taxonomy V2.

        Args:
            item: Content item with title, description, source_name, media_type

        Returns:
            Classification result with enhanced RSIP taxonomy tags
        """
        try:
            # Build prompt
            prompt = CLASSIFICATION_PROMPT_V2.format(
                title=item.get("title", "")[:500],
                description=item.get("description", "")[:2000],
                source_name=item.get("source_name", "Unknown"),
                media_type=item.get("media_type", "video")
            )

            # Call Gemini
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,  # Lower temperature for more consistent classification
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
                        content_type=result.get("content_type"),
                        category=result.get("application_category"),
                        educational_value=result.get("educational_value"),
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

        # Validate content_type (new V2 field)
        if result.get("content_type") not in self.valid_content_types:
            result["content_type"] = "tech_demo"  # Default to tech_demo if unknown

        # Validate deployment_maturity (new V2 field)
        if result.get("deployment_maturity") not in self.valid_deployment_maturity:
            result["deployment_maturity"] = "unknown"

        # Validate category
        if result.get("application_category") not in self.valid_categories:
            result["application_category"] = "industrial_automation"

        # Validate and map specific_tasks to task_types for backward compatibility
        specific_tasks = [
            t for t in result.get("specific_tasks", [])
            if t in self.valid_specific_tasks
        ][:3]
        result["specific_tasks"] = specific_tasks

        # Map specific tasks to broad task_types
        result["task_types"] = self._map_to_broad_tasks(specific_tasks)

        # Validate scene type
        if result.get("scene_type") not in self.valid_scene_types:
            result["scene_type"] = None

        # Validate educational_value (1-5)
        try:
            edu_value = int(result.get("educational_value", 2))
            result["educational_value"] = max(1, min(5, edu_value))
        except (TypeError, ValueError):
            result["educational_value"] = 2

        # Validate relevance score
        try:
            score = float(result.get("relevance_score", 0.5))
            result["relevance_score"] = max(0.0, min(1.0, score))
        except (TypeError, ValueError):
            result["relevance_score"] = 0.5

        # Adjust relevance score based on content_type
        if result["content_type"] == "tech_demo":
            result["relevance_score"] = min(result["relevance_score"], 0.6)
        elif result["content_type"] in ["real_application", "case_study"]:
            result["relevance_score"] = max(result["relevance_score"], 0.7)

        # Validate application_context
        if not isinstance(result.get("application_context"), dict):
            result["application_context"] = {}

        # Ensure confidence is dict
        if not isinstance(result.get("confidence"), dict):
            result["confidence"] = {
                "category": 0.7,
                "tasks": 0.7,
                "requirements": 0.7,
                "content_type": 0.7
            }

        return result

    def _map_to_broad_tasks(self, specific_tasks: list) -> list:
        """Map specific tasks to broad task categories for backward compatibility"""
        task_mapping = {
            # Industrial transport
            "pallet_transport": "transportation",
            "tote_transport": "transportation",
            "cart_towing": "transportation",
            "dock_to_stock": "transportation",
            "material_handling": "transportation",
            # Industrial manipulation
            "machine_tending": "manipulation",
            "assembly_insertion": "assembly",
            "screw_driving": "assembly",
            "bin_picking": "manipulation",
            "kitting": "manipulation",
            "painting": "manipulation",
            # Industrial palletizing
            "case_palletizing": "palletizing",
            "depalletizing": "palletizing",
            # Industrial inspection
            "visual_inspection": "inspection",
            "weld_inspection": "inspection",
            "quality_control": "quality_control",
            # Service delivery
            "room_delivery": "delivery_service",
            "medication_delivery": "delivery_service",
            "food_delivery": "delivery_service",
            # Service cleaning
            "floor_scrubbing": "cleaning",
            "vacuum_cleaning": "cleaning",
            "disinfection": "cleaning",
            # Service interaction
            "reception_greeting": "human_interaction",
            "wayfinding": "human_interaction",
            "telepresence": "human_interaction",
            "companion": "human_interaction",
            "concierge": "human_interaction",
            "inventory_scanning": "inspection",
            # Security
            "perimeter_patrol": "perimeter_patrol",
            "intrusion_detection": "threat_detection",
            "access_verification": "access_monitoring",
            "remote_monitoring": "perimeter_patrol",
            "facility_inspection": "inspection",
        }

        broad_tasks = set()
        for task in specific_tasks:
            if task in task_mapping:
                broad_tasks.add(task_mapping[task])
            elif task in self.valid_task_types:
                broad_tasks.add(task)

        return list(broad_tasks)[:3]

    def _get_default_classification(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Get default classification when AI fails"""
        return {
            "content_type": "tech_demo",  # Conservative default
            "deployment_maturity": "unknown",
            "application_category": item.get("default_category", "industrial_automation"),
            "task_types": item.get("default_tasks", []),
            "specific_tasks": [],
            "functional_requirements": [],
            "environment": {
                "setting": "indoor",
                "human_presence": "low_traffic"
            },
            "application_context": {
                "customer_identified": False,
                "has_metrics": False
            },
            "scene_type": None,
            "educational_value": 2,
            "relevance_score": 0.4,
            "confidence": {
                "category": 0.3,
                "tasks": 0.3,
                "requirements": 0.3,
                "content_type": 0.3
            },
            "summary": f"Robotics content from {item.get('source_name', 'unknown source')}"
        }
