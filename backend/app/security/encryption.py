"""
Encryption service using Fernet symmetric encryption.
Provides data encryption, file encryption, and Aadhaar hashing.
"""
import hashlib
from cryptography.fernet import Fernet

from app.config import get_settings


class EncryptionService:
    """Handles all encryption/decryption operations for sensitive data."""

    def __init__(self):
        settings = get_settings()
        self._key = settings.encryption_key_bytes
        self._fernet = Fernet(self._key)

    def encrypt_data(self, plaintext: str) -> str:
        """
        Encrypt a plaintext string using Fernet.

        Args:
            plaintext: The string to encrypt.

        Returns:
            Base64-encoded ciphertext string.
        """
        return self._fernet.encrypt(plaintext.encode("utf-8")).decode("utf-8")

    def decrypt_data(self, ciphertext: str) -> str:
        """
        Decrypt a Fernet-encrypted ciphertext string.

        Args:
            ciphertext: Base64-encoded ciphertext.

        Returns:
            Original plaintext string.
        """
        return self._fernet.decrypt(ciphertext.encode("utf-8")).decode("utf-8")

    def encrypt_file(self, file_bytes: bytes) -> bytes:
        """
        Encrypt file contents using Fernet.

        Args:
            file_bytes: Raw file bytes.

        Returns:
            Encrypted file bytes.
        """
        return self._fernet.encrypt(file_bytes)

    def decrypt_file(self, encrypted_bytes: bytes) -> bytes:
        """
        Decrypt Fernet-encrypted file contents.

        Args:
            encrypted_bytes: Encrypted file bytes.

        Returns:
            Original file bytes.
        """
        return self._fernet.decrypt(encrypted_bytes)

    @staticmethod
    def hash_aadhaar(aadhaar: str) -> str:
        """
        Create a SHA-256 hash of an Aadhaar number.
        Only the hash is stored; the full number is never persisted.

        Args:
            aadhaar: Full 12-digit Aadhaar number.

        Returns:
            Hex-encoded SHA-256 hash.
        """
        # Normalize: remove spaces and hyphens
        cleaned = aadhaar.replace(" ", "").replace("-", "")
        return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

    @staticmethod
    def get_aadhaar_last_four(aadhaar: str) -> str:
        """
        Extract last 4 digits of Aadhaar for display purposes.

        Args:
            aadhaar: Full 12-digit Aadhaar number.

        Returns:
            Last 4 digits as string.
        """
        cleaned = aadhaar.replace(" ", "").replace("-", "")
        return cleaned[-4:]


# Module-level singleton
_encryption_service = None


def get_encryption_service() -> EncryptionService:
    """Get or create the singleton EncryptionService instance."""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service


def hash_aadhaar(aadhaar: str) -> str:
    """Module-level helper to hash an Aadhaar number."""
    return EncryptionService.hash_aadhaar(aadhaar)


def get_aadhaar_last_four(aadhaar: str) -> str:
    """Module-level helper to extract last 4 digits of Aadhaar."""
    return EncryptionService.get_aadhaar_last_four(aadhaar)

