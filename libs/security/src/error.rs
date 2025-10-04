use std::error::Error;
use std::fmt::{self, Display};

/// Errors that can be produced by the secure database wrapper.
#[derive(Debug)]
pub enum SecureDbError {
    /// Failure while deriving the encryption key using HKDF.
    KeyDerivation,
    /// An error occurred while interacting with the sled database.
    Sled {
        /// High-level context for the sled operation that failed.
        context: &'static str,
        /// Error returned by sled.
        source: sled::Error,
    },
    /// Persisted metadata had an unexpected shape.
    Metadata {
        /// Description of the malformed metadata.
        description: &'static str,
    },
    /// The nonce counter could not be incremented without overflow.
    NonceOverflow,
    /// The internal nonce counter mutex was poisoned by a panic.
    MutexPoisoned,
    /// Encryption failed for the provided plaintext.
    Encryption,
    /// Decryption failed for the stored ciphertext.
    Decryption,
}

impl Display for SecureDbError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SecureDbError::KeyDerivation => write!(f, "failed to derive encryption key"),
            SecureDbError::Sled { context, .. } => write!(f, "{}", context),
            SecureDbError::Metadata { description } => write!(f, "{}", description),
            SecureDbError::NonceOverflow => write!(f, "nonce counter overflowed"),
            SecureDbError::MutexPoisoned => write!(f, "nonce counter mutex was poisoned"),
            SecureDbError::Encryption => write!(f, "failed to encrypt value"),
            SecureDbError::Decryption => write!(f, "failed to decrypt value"),
        }
    }
}

impl Error for SecureDbError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            SecureDbError::Sled { source, .. } => Some(source),
            _ => None,
        }
    }
}

impl SecureDbError {
    /// Helper constructor for sled-related errors with context.
    pub fn sled(context: &'static str, err: sled::Error) -> Self {
        SecureDbError::Sled {
            context,
            source: err,
        }
    }

    /// Helper constructor for metadata validation failures.
    pub fn metadata(description: &'static str) -> Self {
        SecureDbError::Metadata { description }
    }
}

impl From<hkdf::InvalidLength> for SecureDbError {
    fn from(_source: hkdf::InvalidLength) -> Self {
        SecureDbError::KeyDerivation
    }
}

/// Convenience alias for results returned by the security library.
pub type SecureDbResult<T> = Result<T, SecureDbError>;
