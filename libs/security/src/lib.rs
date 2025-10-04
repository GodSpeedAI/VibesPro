//! Security primitives for the VibesPro platform.
//! Currently exposes an encrypted redb wrapper providing secure data storage.

pub mod error;
pub mod key_mgmt;
pub mod secure_db;

pub use error::{SecureDbError, SecureDbResult};
pub use secure_db::SecureDb;
