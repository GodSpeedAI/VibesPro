use std::error::Error;
use std::fmt::{self, Display};

/// Errors that can be produced by the secure database wrapper.
#[derive(Debug)]
pub enum SecureDbError {
    /// Failure while deriving the encryption key using HKDF.
    KeyDerivation,
    /// An error occurred while interacting with the redb database.
    Database {
        /// High-level context for the database operation that failed.
        context: &'static str,
        /// Error returned by redb.
        source: redb::Error,
    },
    /// An error occurred during a redb transaction.
    Transaction {
        /// High-level context for the transaction that failed.
        context: &'static str,
        /// Error returned by redb.
        source: redb::TransactionError,
    },
    /// An error occurred during a redb table operation.
    Table {
        /// High-level context for the table operation that failed.
        context: &'static str,
        /// Error returned by redb.
        source: redb::TableError,
    },
    /// An error occurred during a redb storage operation.
    Storage {
        /// High-level context for the storage operation that failed.
        context: &'static str,
        /// Error returned by redb.
        source: redb::StorageError,
    },
    /// An error occurred during a redb commit operation.
    Commit {
        /// High-level context for the commit operation that failed.
        context: &'static str,
        /// Error returned by redb.
        source: redb::CommitError,
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
            SecureDbError::Database { context, .. } => write!(f, "{}", context),
            SecureDbError::Transaction { context, .. } => write!(f, "{}", context),
            SecureDbError::Table { context, .. } => write!(f, "{}", context),
            SecureDbError::Storage { context, .. } => write!(f, "{}", context),
            SecureDbError::Commit { context, .. } => write!(f, "{}", context),
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
            SecureDbError::Database { source, .. } => Some(source),
            SecureDbError::Transaction { source, .. } => Some(source),
            SecureDbError::Table { source, .. } => Some(source),
            SecureDbError::Storage { source, .. } => Some(source),
            SecureDbError::Commit { source, .. } => Some(source),
            _ => None,
        }
    }
}

impl SecureDbError {
    /// Helper constructor for database-related errors with context.
    pub fn database(context: &'static str, err: redb::Error) -> Self {
        SecureDbError::Database {
            context,
            source: err,
        }
    }

    /// Helper constructor for transaction-related errors with context.
    pub fn transaction(context: &'static str, err: redb::TransactionError) -> Self {
        SecureDbError::Transaction {
            context,
            source: err,
        }
    }

    /// Helper constructor for table-related errors with context.
    pub fn table(context: &'static str, err: redb::TableError) -> Self {
        SecureDbError::Table {
            context,
            source: err,
        }
    }

    /// Helper constructor for storage-related errors with context.
    pub fn storage(context: &'static str, err: redb::StorageError) -> Self {
        SecureDbError::Storage {
            context,
            source: err,
        }
    }

    /// Helper constructor for commit-related errors with context.
    pub fn commit(context: &'static str, err: redb::CommitError) -> Self {
        SecureDbError::Commit {
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
