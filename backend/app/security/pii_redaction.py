"""
PII (Personally Identifiable Information) redaction utilities.
Ensures sensitive data is never logged or sent to third-party services in raw form.
"""
import re
from typing import Dict, List, Optional


class PIIRedactor:
    """Redacts various types of PII from text and structured data."""

    # Aadhaar: 12-digit number, possibly formatted as XXXX-XXXX-XXXX or XXXX XXXX XXXX
    AADHAAR_PATTERN = re.compile(r"\b(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})\b")

    # Indian phone numbers: 10 digits possibly with +91 prefix
    PHONE_PATTERN = re.compile(r"(?:\+91[\s-]?)?(?:0)?([6-9]\d{5})(\d{4})\b")

    # Email addresses
    EMAIL_PATTERN = re.compile(r"\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b")

    # PAN number: ABCDE1234F
    PAN_PATTERN = re.compile(r"\b([A-Z]{3})([A-Z]{2})(\d{4})([A-Z])\b")

    @classmethod
    def redact_aadhaar(cls, text: str) -> str:
        """
        Redact Aadhaar numbers, keeping only the last 4 digits.
        '1234 5678 9012' becomes 'XXXX-XXXX-9012'
        """
        def replace_aadhaar(match):
            last_four = match.group(3)
            return f"XXXX-XXXX-{last_four}"
        return cls.AADHAAR_PATTERN.sub(replace_aadhaar, text)

    @classmethod
    def redact_phone(cls, text: str) -> str:
        """
        Redact phone numbers, keeping only the last 4 digits.
        '9876543210' becomes '******3210'
        """
        def replace_phone(match):
            last_four = match.group(2)
            return f"******{last_four}"
        return cls.PHONE_PATTERN.sub(replace_phone, text)

    @classmethod
    def redact_email(cls, text: str) -> str:
        """
        Redact email addresses.
        'user@example.com' becomes 'u***@example.com'
        """
        def replace_email(match):
            local = match.group(1)
            domain = match.group(2)
            if len(local) > 1:
                redacted_local = local[0] + "***"
            else:
                redacted_local = "***"
            return f"{redacted_local}@{domain}"
        return cls.EMAIL_PATTERN.sub(replace_email, text)

    @classmethod
    def redact_pan(cls, text: str) -> str:
        """
        Redact PAN numbers.
        'ABCDE1234F' becomes 'XXXXX1234X'
        """
        def replace_pan(match):
            digits = match.group(3)
            return f"XXXXX{digits}X"
        return cls.PAN_PATTERN.sub(replace_pan, text)

    @classmethod
    def redact_all(cls, text: str) -> str:
        """Apply all redaction patterns to the given text."""
        result = cls.redact_aadhaar(text)
        result = cls.redact_phone(result)
        result = cls.redact_email(result)
        result = cls.redact_pan(result)
        return result

    @classmethod
    def minimize_for_ai(cls, data: dict, required_fields: List[str]) -> dict:
        """
        Data minimization: return only the fields required for AI processing,
        with PII fields redacted.

        Args:
            data: Full data dictionary.
            required_fields: List of field names the AI operation actually needs.

        Returns:
            Minimized dictionary with only required fields, PII redacted.
        """
        minimized = {}
        pii_fields = {"aadhaar", "aadhaar_number", "phone", "email", "pan", "password", "password_hash"}

        for field in required_fields:
            if field in data:
                value = data[field]
                # Redact known PII fields
                if field in pii_fields:
                    if isinstance(value, str):
                        minimized[field] = cls.redact_all(value)
                    else:
                        minimized[field] = "[REDACTED]"
                elif isinstance(value, str):
                    # Apply general redaction to string values
                    minimized[field] = cls.redact_all(value)
                else:
                    minimized[field] = value

        return minimized

    @classmethod
    def get_redacted_fields(cls, data: dict) -> List[str]:
        """
        Identify which fields in a data dictionary contain PII.

        Returns:
            List of field names that contain or may contain PII.
        """
        pii_field_names = {
            "aadhaar", "aadhaar_number", "aadhaar_last_four", "aadhaar_hash",
            "phone", "mobile", "email", "pan", "password", "password_hash",
            "bank_account", "ifsc", "full_name", "name", "address",
            "date_of_birth", "dob",
        }
        found = []
        for key in data:
            if key.lower() in pii_field_names:
                found.append(key)
            elif isinstance(data[key], str):
                # Check if value contains PII patterns
                original = data[key]
                redacted = cls.redact_all(original)
                if original != redacted:
                    found.append(key)
        return found
