"""
Rule-based eligibility engine for FormSaathi.
Evaluates scheme criteria deterministically with transparent explanations and percentage scoring.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.scheme import Scheme, SchemeEligibilityRule, RuleOperator
from app.models.user import ApplicantProfile
from app.schemas.eligibility import (
    EligibilityResponse,
    EligibilityCondition,
    QuestionnaireResponse,
    QuestionnaireField,
)


class EligibilityEngine:
    """
    Deterministic rule-based eligibility evaluation engine.
    Rules are verified strictly against applicant profile attributes.
    """

    @staticmethod
    def _evaluate_condition(
        operator: RuleOperator,
        applicant_val: Any,
        target_val: Any,
    ) -> bool:
        if applicant_val is None:
            return False

        try:
            if operator == RuleOperator.EQ:
                return str(applicant_val).strip().lower() == str(target_val).strip().lower()
            elif operator == RuleOperator.NEQ:
                return str(applicant_val).strip().lower() != str(target_val).strip().lower()
            elif operator == RuleOperator.LT:
                return float(applicant_val) < float(target_val)
            elif operator == RuleOperator.LTE:
                return float(applicant_val) <= float(target_val)
            elif operator == RuleOperator.GT:
                return float(applicant_val) > float(target_val)
            elif operator == RuleOperator.GTE:
                return float(applicant_val) >= float(target_val)
            elif operator == RuleOperator.IN:
                if isinstance(target_val, list):
                    return str(applicant_val) in [str(x) for x in target_val]
                return str(applicant_val) in str(target_val)
            elif operator == RuleOperator.NOT_IN:
                if isinstance(target_val, list):
                    return str(applicant_val) not in [str(x) for x in target_val]
                return str(applicant_val) not in str(target_val)
            elif operator == RuleOperator.EXISTS:
                return bool(applicant_val)
        except (ValueError, TypeError):
            return False

        return False

    @classmethod
    def assess_eligibility(
        cls,
        db: Session,
        profile: Optional[ApplicantProfile],
        scheme: Scheme,
    ) -> EligibilityResponse:
        """
        Assess eligibility of an applicant profile against a scheme's rules.
        """
        rules = db.query(SchemeEligibilityRule).filter(
            SchemeEligibilityRule.scheme_id == scheme.id
        ).order_by(SchemeEligibilityRule.priority.desc()).all()

        conditions: List[EligibilityCondition] = []
        disqualifying_conditions: List[EligibilityCondition] = []
        missing_info: List[str] = []

        total_rules = len(rules)
        met_rules = 0

        # Extract profile dictionary
        profile_data = {}
        if profile:
            profile_data = {
                "domicile_state": profile.domicile_state,
                "category": profile.category.value if profile.category else None,
                "annual_family_income": profile.annual_family_income,
                "current_education_level": profile.current_education_level,
                "institution_name": profile.institution_name,
                "bank_account_linked": profile.bank_account_linked,
                "npci_mapped": profile.npci_mapped,
                "sslc_registration_number": profile.sslc_registration_number,
            }

        user_category = profile_data.get("category")

        for rule in rules:
            # Check if this rule applies only to specific categories
            if rule.condition_category:
                if not user_category or user_category not in rule.condition_category:
                    # Skip rule if not applicable to applicant's category
                    total_rules -= 1
                    continue

            applicant_val = profile_data.get(rule.field_name)

            if applicant_val is None:
                missing_info.append(rule.field_name)
                cond = EligibilityCondition(
                    rule_key=rule.rule_key,
                    field_name=rule.field_name,
                    met=False,
                    explanation=f"Missing information: {rule.description or rule.field_name}. Please update your profile.",
                    is_disqualifying=rule.is_disqualifying,
                    applicant_value=None,
                    required_value=rule.value,
                )
                conditions.append(cond)
                if rule.is_disqualifying:
                    disqualifying_conditions.append(cond)
                continue

            is_met = cls._evaluate_condition(rule.operator, applicant_val, rule.value)

            # Generate natural, transparent explanation
            explanation = ""
            if rule.rule_key == "domicile":
                if is_met:
                    explanation = f"Verified: Applicant is a permanent resident of {applicant_val}."
                else:
                    explanation = f"Ineligible: Scheme requires permanent residency in {rule.value}. Profile indicates {applicant_val}."
            elif rule.rule_key == "category":
                if is_met:
                    explanation = f"Verified: Category '{applicant_val}' is eligible under this scholarship."
                else:
                    explanation = f"Ineligible: Category '{applicant_val}' is not in the list of eligible categories for this specific scheme."
            elif "income" in rule.rule_key:
                if is_met:
                    explanation = f"Verified: Annual family income ₹{applicant_val:,} is within the official ceiling of ₹{rule.value:,} for category {user_category}."
                else:
                    explanation = f"Ineligible: Annual family income ₹{applicant_val:,} exceeds the ceiling of ₹{rule.value:,} for category {user_category}."
            elif rule.rule_key == "education":
                if is_met:
                    explanation = f"Verified: Currently enrolled education level '{applicant_val}' qualifies as Post-Matric."
                else:
                    explanation = f"Ineligible: Level '{applicant_val}' does not qualify for Post-Matric assistance."
            elif rule.rule_key == "bank_aadhaar":
                if is_met:
                    explanation = "Verified: Bank account is Aadhaar-seeded and NPCI-mapped for Direct Benefit Transfer (DBT)."
                else:
                    explanation = "Action Required: Bank account must be seeded with Aadhaar and mapped with NPCI to receive direct benefit disbursement."
            else:
                status_str = "meets" if is_met else "does not meet"
                explanation = f"Applicant {status_str} requirement: {rule.description or rule.rule_key}."

            cond = EligibilityCondition(
                rule_key=rule.rule_key,
                field_name=rule.field_name,
                met=is_met,
                explanation=explanation,
                is_disqualifying=rule.is_disqualifying,
                applicant_value=applicant_val,
                required_value=rule.value,
            )
            conditions.append(cond)

            if is_met:
                met_rules += 1
            elif rule.is_disqualifying:
                disqualifying_conditions.append(cond)

        effective_total = max(total_rules, 1)
        percentage = round((met_rules / effective_total) * 100, 1)

        # Overriding eligibility check: must have no disqualifying conditions met=False, and percentage >= 75
        overall_eligible = (len(disqualifying_conditions) == 0) and (percentage >= 80.0)

        # Build required documents list from scheme
        req_docs = [doc.document_name for doc in scheme.required_documents if doc.is_mandatory]

        # Recommendation
        if overall_eligible:
            recommendation = "You satisfy the official criteria. Connect DigiLocker and prepare required documents to proceed."
        elif disqualifying_conditions:
            recommendation = "You currently do not qualify due to one or more statutory disqualifications listed below."
        elif missing_info:
            recommendation = "Please complete the missing profile fields in the questionnaire to finalize your eligibility check."
        else:
            recommendation = "Partial eligibility. Please review non-mandatory requirements such as bank Aadhaar mapping."

        return EligibilityResponse(
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            overall_eligible=overall_eligible,
            eligibility_percentage=percentage,
            conditions=conditions,
            disqualifying_conditions=disqualifying_conditions,
            missing_info=list(set(missing_info)),
            required_documents=req_docs,
            recommendation=recommendation,
        )

    @classmethod
    def get_questionnaire(
        cls,
        db: Session,
        scheme: Scheme,
        profile: Optional[ApplicantProfile] = None,
    ) -> QuestionnaireResponse:
        """
        Generate dynamic questionnaire fields based on scheme requirements.
        """
        fields = [
            QuestionnaireField(
                field_name="domicile_state",
                label="Domicile State",
                field_type="select",
                required=True,
                options=["Karnataka", "Maharashtra", "Tamil Nadu", "Kerala", "Andhra Pradesh", "Other"],
                description="State where you hold permanent residency.",
                current_value=profile.domicile_state if profile else "Karnataka",
            ),
            QuestionnaireField(
                field_name="category",
                label="Social Category / Community",
                field_type="select",
                required=True,
                options=["SC", "ST", "OBC_CAT1", "OBC_2A", "OBC_2B", "OBC_3A", "OBC_3B", "GENERAL"],
                description="Official reservation category recognized by Govt of Karnataka.",
                current_value=profile.category.value if profile and profile.category else None,
            ),
            QuestionnaireField(
                field_name="annual_family_income",
                label="Annual Family Income (₹)",
                field_type="number",
                required=True,
                description="Total gross annual income from all sources as certified in Revenue Department Income Certificate.",
                current_value=profile.annual_family_income if profile else None,
            ),
            QuestionnaireField(
                field_name="current_education_level",
                label="Current Education Level",
                field_type="select",
                required=True,
                options=["CLASS_11", "CLASS_12", "ITI", "DIPLOMA", "UNDERGRADUATE", "POSTGRADUATE", "PHD"],
                description="Currently enrolled post-matric academic program.",
                current_value=profile.current_education_level if profile else None,
            ),
            QuestionnaireField(
                field_name="institution_name",
                label="College / Institution Name",
                field_type="text",
                required=True,
                description="Recognized college or university in Karnataka.",
                current_value=profile.institution_name if profile else None,
            ),
            QuestionnaireField(
                field_name="sslc_registration_number",
                label="SSLC / 10th Registration Number",
                field_type="text",
                required=True,
                description="Registration number from your 10th standard certificate / SATS ID.",
                current_value=profile.sslc_registration_number if profile else None,
            ),
            QuestionnaireField(
                field_name="bank_account_linked",
                label="Bank Account Seeded with Aadhaar",
                field_type="boolean",
                required=True,
                description="Direct Benefit Transfer requires your bank account to be linked with Aadhaar.",
                current_value=profile.bank_account_linked if profile else False,
            ),
            QuestionnaireField(
                field_name="npci_mapped",
                label="NPCI Direct Benefit Transfer (DBT) Mapped",
                field_type="boolean",
                required=True,
                description="Check NPCI status on UIDAI portal or with your bank branch.",
                current_value=profile.npci_mapped if profile else False,
            ),
        ]

        # Calculate completion percentage
        completed = sum(1 for f in fields if f.current_value not in (None, "", False))
        completion_percentage = round((completed / len(fields)) * 100, 1)

        return QuestionnaireResponse(
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            fields=fields,
            completion_percentage=completion_percentage,
        )
