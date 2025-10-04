use std::convert::TryInto;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::thread;

use security::SecureDb;
use tempfile::tempdir;

fn create_db_path(test_name: &str) -> (tempfile::TempDir, PathBuf) {
    let dir = tempdir().expect("failed to create temp directory");
    let path = dir.path().join(test_name);
    (dir, path)
}

fn collect_db_bytes(path: &Path, buffer: &mut Vec<u8>) {
    if path.is_file() {
        buffer.extend(fs::read(path).expect("failed to read db file"));
        return;
    }

    if path.is_dir() {
        for entry in fs::read_dir(path).expect("failed to read db directory") {
            let entry = entry.expect("failed to iterate directory entry");
            collect_db_bytes(&entry.path(), buffer);
        }
    }
}

#[test]
fn test_encrypt_decrypt_roundtrip() {
    let (_guard, path) = create_db_path("roundtrip_db");
    let key = [0u8; 32];
    let db = SecureDb::open(&path, &key).expect("failed to open secure db");

    db.insert(b"key1", b"value1")
        .expect("failed to insert value");
    let retrieved = db.get(b"key1").expect("read failed");

    assert_eq!(retrieved, Some(b"value1".to_vec()));
}

#[test]
fn test_nonce_monotonicity() {
    let (_guard, path) = create_db_path("nonce_db");
    let key = [0u8; 32];
    let db = SecureDb::open(&path, &key).expect("failed to open secure db");

    let nonce1 = db.next_nonce().expect("nonce generation failed");
    let nonce2 = db.next_nonce().expect("nonce generation failed");

    assert_ne!(nonce1, nonce2, "nonces should be unique");

    let counter2 = u64::from_le_bytes(nonce2[..8].try_into().unwrap());
    
    // Flush to ensure counter is persisted before closing
    db.flush().expect("flush failed");
    drop(db);

    let db_reopened = SecureDb::open(&path, &key).expect("failed to reopen secure db");
    let nonce3 = db_reopened.next_nonce().expect("nonce generation failed");
    let counter3 = u64::from_le_bytes(nonce3[..8].try_into().unwrap());

    assert!(
        counter3 > counter2,
        "nonce counter should be monotonic across reopen"
    );
}

#[test]
fn test_no_plaintext_on_disk() {
    let (_guard, path) = create_db_path("plaintext_db");
    let key = [0u8; 32];
    let db = SecureDb::open(&path, &key).expect("failed to open secure db");

    db.insert(b"secret", b"SENSITIVE_DATA")
        .expect("failed to insert secret value");
    db.flush().expect("flush failed");
    drop(db);

    let mut raw_bytes = Vec::new();
    collect_db_bytes(&path, &mut raw_bytes);
    assert!(
        !raw_bytes
            .windows(b"SENSITIVE_DATA".len())
            .any(|chunk| chunk == b"SENSITIVE_DATA"),
        "plaintext should not appear on disk"
    );
}

#[test]
fn test_wrong_key_fails() {
    let (_guard, path) = create_db_path("wrong_key_db");
    let key1 = [0u8; 32];
    let mut key2 = [0u8; 32];
    key2[0] = 1;

    let db = SecureDb::open(&path, &key1).expect("failed to open secure db");
    db.insert(b"key", b"value").expect("failed to insert value");
    db.flush().expect("flush failed");
    drop(db);

    let db_wrong_key = SecureDb::open(&path, &key2).expect("failed to reopen secure db");
    let result = db_wrong_key.get(b"key");
    assert!(result.is_err(), "decryption with wrong key should fail");
}

#[test]
fn test_concurrent_inserts() {
    let (_guard, path) = create_db_path("concurrent_db");
    let key = [0u8; 32];
    let db = Arc::new(SecureDb::open(&path, &key).expect("failed to open secure db"));

    let mut handles = Vec::new();

    for i in 0..10u8 {
        let db_clone = Arc::clone(&db);
        handles.push(thread::spawn(move || {
            let key = format!("key{i}");
            db_clone
                .insert(key.as_bytes(), b"value")
                .expect("concurrent insert failed");
        }));
    }

    for handle in handles {
        handle.join().expect("thread panicked");
    }

    for i in 0..10u8 {
        let key = format!("key{i}");
        let value = db.get(key.as_bytes()).expect("read failed");
        assert_eq!(value, Some(b"value".to_vec()));
    }
}
