use std::path::Path;
use std::sync::Mutex;

use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::{XChaCha20Poly1305, XNonce};
use redb::{Database, ReadableTable, TableDefinition};
use uuid::Uuid;

use crate::error::{SecureDbError, SecureDbResult};
use crate::key_mgmt::derive_encryption_key;

const DB_UUID_KEY: &[u8] = b"__db_uuid";
const NONCE_COUNTER_KEY: &[u8] = b"__nonce_counter";

// Define table for encrypted data storage
const DATA_TABLE: TableDefinition<&[u8], &[u8]> = TableDefinition::new("data");

/// Wrapper around `redb::Database` that transparently encrypts values using XChaCha20-Poly1305.
///
/// ## Performance Optimization (TASK-016 + redb migration)
/// The nonce counter is kept in memory and only persisted on flush().
/// This eliminates per-operation transaction overhead in redb.
/// **IMPORTANT**: Always call flush() before dropping the database to ensure
/// counter persistence. On crash, nonces from the persisted value onward
/// will be reused, which is cryptographically safe but consumes counter space.
pub struct SecureDb {
    db: Database,
    cipher: XChaCha20Poly1305,
    counter: Mutex<u64>,
    db_uuid: [u8; 16],
}

impl SecureDb {
    /// Opens (or creates) an encrypted redb database at the provided path using the given master key.
    pub fn open<P: AsRef<Path>>(path: P, master_key: &[u8]) -> SecureDbResult<Self> {
        let okm = derive_encryption_key(master_key)?;
        let cipher = XChaCha20Poly1305::new((&*okm).into());

        let db = Database::create(path)
            .map_err(|err| SecureDbError::database("failed to open redb database", err.into()))?;

        let write_txn = db
            .begin_write()
            .map_err(|err| SecureDbError::transaction("failed to begin write transaction", err))?;

        {
            let mut table = write_txn
                .open_table(DATA_TABLE)
                .map_err(|err| SecureDbError::table("failed to open data table", err))?;

            // Check if UUID exists
            let uuid_exists = table
                .get(DB_UUID_KEY)
                .map_err(|err| SecureDbError::storage("failed to load database uuid", err))?
                .is_some();

            if !uuid_exists {
                let uuid = *Uuid::new_v4().as_bytes();
                table
                    .insert(DB_UUID_KEY, uuid.as_slice())
                    .map_err(|err| SecureDbError::storage("failed to persist database uuid", err))?;
            }

            // Check if counter exists
            let counter_exists = table
                .get(NONCE_COUNTER_KEY)
                .map_err(|err| SecureDbError::storage("failed to load nonce counter", err))?
                .is_some();

            if !counter_exists {
                table
                    .insert(NONCE_COUNTER_KEY, 0u64.to_le_bytes().as_slice())
                    .map_err(|err| {
                        SecureDbError::storage("failed to persist initial nonce counter", err)
                    })?;
            }

            drop(table);
        }

        write_txn
            .commit()
            .map_err(|err| SecureDbError::commit("failed to commit initial setup", err))?;

        // Re-read values after commit
        let read_txn = db
            .begin_read()
            .map_err(|err| SecureDbError::transaction("failed to begin read transaction", err))?;

        let table = read_txn
            .open_table(DATA_TABLE)
            .map_err(|err| SecureDbError::table("failed to open data table for reading", err))?;

        let db_uuid: [u8; 16] = table
            .get(DB_UUID_KEY)
            .map_err(|err| SecureDbError::storage("failed to load database uuid", err))?
            .ok_or(SecureDbError::metadata("database uuid not found after initialization"))?
            .value()
            .try_into()
            .map_err(|_| SecureDbError::metadata("stored database uuid has invalid length"))?;

        let counter = table
            .get(NONCE_COUNTER_KEY)
            .map_err(|err| SecureDbError::storage("failed to load nonce counter", err))?
            .ok_or(SecureDbError::metadata("nonce counter not found after initialization"))?
            .value()
            .try_into()
            .map(u64::from_le_bytes)
            .map_err(|_| SecureDbError::metadata("stored nonce counter has invalid length"))?;

        drop(table);
        drop(read_txn);

        Ok(Self {
            db,
            cipher,
            counter: Mutex::new(counter),
            db_uuid,
        })
    }

    /// Allocates a unique nonce derived from the persisted counter and database UUID.
    ///
    /// ## Performance Optimization (TASK-016 + redb migration)
    /// Counter is kept in memory and only persisted on flush().
    /// This eliminates transaction overhead from every operation.
    /// Call flush() before closing the DB to ensure the counter is fully persisted.
    fn allocate_nonce(&self) -> SecureDbResult<([u8; 24], XNonce)> {
        let mut guard = self
            .counter
            .lock()
            .map_err(|_| SecureDbError::MutexPoisoned)?;

        let current = *guard;
        let next = current.checked_add(1).ok_or(SecureDbError::NonceOverflow)?;

        *guard = next;

        let mut nonce_bytes = [0u8; 24];
        nonce_bytes[..8].copy_from_slice(&current.to_le_bytes());
        nonce_bytes[8..24].copy_from_slice(&self.db_uuid);

        let nonce = XNonce::from_slice(&nonce_bytes).to_owned();
        Ok((nonce_bytes, nonce))
    }

    /// Generates the next nonce for validation scenarios. This advances the persistent counter.
    pub fn next_nonce(&self) -> SecureDbResult<[u8; 24]> {
        let (bytes, _) = self.allocate_nonce()?;
        Ok(bytes)
    }

    /// Inserts a value, encrypting it before writing to disk.
    pub fn insert(&self, key: &[u8], value: &[u8]) -> SecureDbResult<Option<Vec<u8>>> {
        let (nonce_bytes, nonce) = self.allocate_nonce()?;
        let ciphertext = self
            .cipher
            .encrypt(&nonce, value)
            .map_err(|_| SecureDbError::Encryption)?;

        let mut payload = Vec::with_capacity(nonce_bytes.len() + ciphertext.len());
        payload.extend_from_slice(&nonce_bytes);
        payload.extend_from_slice(&ciphertext);

        let write_txn = self.db.begin_write().map_err(|err| {
            SecureDbError::transaction("failed to begin write transaction for insert", err)
        })?;

        let previous_plaintext = {
            let mut table = write_txn
                .open_table(DATA_TABLE)
                .map_err(|err| SecureDbError::table("failed to open data table for insert", err))?;

            // Get previous value and immediately extract bytes
            let previous_bytes = match table
                .insert(key, payload.as_slice())
                .map_err(|err| SecureDbError::storage("failed to write encrypted value", err))?
            {
                Some(guard) => Some(guard.value().to_vec()),
                None => None,
            };

            drop(table);

            // Decrypt after dropping table guard
            match previous_bytes {
                Some(bytes) => self.try_decrypt_entry(&bytes)?,
                None => None,
            }
        };

        write_txn
            .commit()
            .map_err(|err| SecureDbError::commit("failed to commit insert", err))?;

        Ok(previous_plaintext)
    }

    /// Retrieves and decrypts a value for the provided key.
    pub fn get(&self, key: &[u8]) -> SecureDbResult<Option<Vec<u8>>> {
        let read_txn = self
            .db
            .begin_read()
            .map_err(|err| SecureDbError::transaction("failed to begin read transaction", err))?;

        let table = read_txn
            .open_table(DATA_TABLE)
            .map_err(|err| SecureDbError::table("failed to open data table for read", err))?;

        let value = match table
            .get(key)
            .map_err(|err| SecureDbError::storage("failed to read encrypted value", err))?
        {
            Some(v) => v.value().to_vec(),
            None => {
                drop(table);
                drop(read_txn);
                return Ok(None);
            }
        };

        drop(table);
        drop(read_txn);

        Ok(Some(self.decrypt_entry(&value)?))
    }

    /// Removes a key from the database, returning the decrypted value when present.
    pub fn remove(&self, key: &[u8]) -> SecureDbResult<Option<Vec<u8>>> {
        let write_txn = self.db.begin_write().map_err(|err| {
            SecureDbError::transaction("failed to begin write transaction for remove", err)
        })?;

        let previous_bytes = {
            let mut table = write_txn
                .open_table(DATA_TABLE)
                .map_err(|err| SecureDbError::table("failed to open data table for remove", err))?;

            // Get removed value and immediately extract bytes
            let bytes = match table
                .remove(key)
                .map_err(|err| SecureDbError::storage("failed to remove encrypted value", err))?
            {
                Some(guard) => guard.value().to_vec(),
                None => {
                    return Ok(None);
                }
            };

            bytes
        };

        write_txn
            .commit()
            .map_err(|err| SecureDbError::commit("failed to commit remove", err))?;

        Ok(Some(self.decrypt_entry(&previous_bytes)?))
    }

    /// Flushes outstanding redb operations, ensuring ciphertexts are durable.
    ///
    /// ## Performance Note (TASK-016)
    /// Also persists the current nonce counter to ensure proper recovery.
    /// Always call this before closing the database.
    pub fn flush(&self) -> SecureDbResult<()> {
        // Persist current counter value
        let guard = self
            .counter
            .lock()
            .map_err(|_| SecureDbError::MutexPoisoned)?;

        let counter_value = *guard;
        drop(guard);

        let write_txn = self.db.begin_write().map_err(|err| {
            SecureDbError::transaction("failed to begin write transaction for flush", err)
        })?;

        {
            let mut table = write_txn.open_table(DATA_TABLE).map_err(|err| {
                SecureDbError::table("failed to open data table for flush", err)
            })?;

            table
                .insert(NONCE_COUNTER_KEY, counter_value.to_le_bytes().as_slice())
                .map_err(|err| SecureDbError::storage("failed to persist nonce counter", err))?;

            drop(table);
        }

        write_txn
            .commit()
            .map_err(|err| SecureDbError::commit("failed to commit flush", err))?;

        Ok(())
    }

    fn decrypt_entry(&self, entry: &[u8]) -> SecureDbResult<Vec<u8>> {
        if entry.len() < 24 {
            return Err(SecureDbError::metadata(
                "stored entry shorter than nonce prefix",
            ));
        }

        let (nonce_bytes, ciphertext) = entry.split_at(24);
        let nonce = XNonce::from_slice(nonce_bytes);
        self.cipher
            .decrypt(nonce, ciphertext)
            .map_err(|_| SecureDbError::Decryption)
    }

    fn try_decrypt_entry(&self, entry: &[u8]) -> SecureDbResult<Option<Vec<u8>>> {
        match self.decrypt_entry(entry) {
            Ok(plaintext) => Ok(Some(plaintext)),
            Err(SecureDbError::Decryption) => Ok(None),
            Err(err) => Err(err),
        }
    }
}
