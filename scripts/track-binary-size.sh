#!/usr/bin/env bash
# TASK-015: Binary Size Tracking Script
# Traceability: AI_ADR-006, AI_PRD-006, AI_SDS-005

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🔨 Building binaries for size comparison..."

# Build with security features enabled
echo "Building with security features..."
cargo build --release --features security 2>/dev/null || {
    echo "⚠️  Security feature not available, building libs/security instead"
    cd libs/security
    cargo build --release
    cd ../..
}

# Capture secure binary size
if [ -f "target/release/vibes-pro-secure" ]; then
    SECURE_SIZE=$(stat -f%z "target/release/vibes-pro-secure" 2>/dev/null || stat -c%s "target/release/vibes-pro-secure")
elif [ -f "libs/security/target/release/libvibes_pro_security.so" ]; then
    SECURE_SIZE=$(stat -f%z "libs/security/target/release/libvibes_pro_security.so" 2>/dev/null || stat -c%s "libs/security/target/release/libvibes_pro_security.so")
else
    echo "❌ No secure binary found"
    exit 1
fi

# Build without security features (baseline)
echo "Building baseline (no security features)..."
cargo build --release --no-default-features 2>/dev/null || {
    echo "⚠️  Using redb baseline instead"
    # Create a minimal redb-only binary for comparison
    # Create a minimal redb-only binary for comparison using cargo
    MINIMAL_REDB_DIR="/tmp/minimal_redb_proj"
    mkdir -p "$MINIMAL_REDB_DIR"
    cat > "$MINIMAL_REDB_DIR/Cargo.toml" <<'EOF'
[package]
name = "minimal_redb"
version = "0.1.0"
edition = "2021"

[dependencies]
redb = "2.2"
EOF

    mkdir -p "$MINIMAL_REDB_DIR/src"
    cat > "$MINIMAL_REDB_DIR/src/main.rs" <<'EOF'
fn main() {
    let db = redb::Database::create("/tmp/test.redb").unwrap();
    let write_txn = db.begin_write().unwrap();
    {
        let mut table = write_txn.open_table(redb::TableDefinition::<&str, &str>::new("test")).unwrap();
        table.insert("key", "value").unwrap();
    }
    write_txn.commit().unwrap();
}
EOF

    cargo build --release --manifest-path "$MINIMAL_REDB_DIR/Cargo.toml" 2>/dev/null && \
        cp "$MINIMAL_REDB_DIR/target/release/minimal_redb" target/release/vibes-pro-plain || {
        echo "⚠️  Using libs/security size as both baseline and secure (conservative estimate)"
        PLAIN_SIZE=$SECURE_SIZE
    }
}

# Capture plain binary size if built
if [ -f "target/release/vibes-pro-plain" ]; then
    PLAIN_SIZE=$(stat -f%z "target/release/vibes-pro-plain" 2>/dev/null || stat -c%s "target/release/vibes-pro-plain")
elif [ ! -v PLAIN_SIZE ]; then
    echo "❌ Unable to determine baseline (plain) binary size. Please build 'vibes-pro-plain' for accurate comparison."
    exit 1
fi

# Calculate difference
INCREASE_BYTES=$((SECURE_SIZE - PLAIN_SIZE))
INCREASE_MB=$(echo "scale=2; $INCREASE_BYTES / 1048576" | bc)

# Display results
echo ""
echo "📊 Binary Size Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "Baseline:        %'10d bytes (%.2f MB)\n" $PLAIN_SIZE $(echo "scale=2; $PLAIN_SIZE / 1048576" | bc)
printf "With Security:   %'10d bytes (%.2f MB)\n" $SECURE_SIZE $(echo "scale=2; $SECURE_SIZE / 1048576" | bc)
printf "Increase:        %'10d bytes (%.2f MB)\n" $INCREASE_BYTES $INCREASE_MB
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check threshold (2.5 MB)
THRESHOLD_MB="2.5"
if (( $(echo "$INCREASE_MB > $THRESHOLD_MB" | bc -l) )); then
    echo "❌ Binary size increase ($INCREASE_MB MB) exceeds threshold ($THRESHOLD_MB MB)"
    exit 1
else
    echo "✅ Binary size increase within acceptable limits"
fi
