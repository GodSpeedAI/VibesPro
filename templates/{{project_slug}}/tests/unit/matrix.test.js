// Unit tests for tools/spec/matrix.js thread linking functionality
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildMatrix, renderMatrixTable, updateMatrixFile } = require('../../tools/spec/matrix');

// Test that the matrix can link spec/plan/tasks triplets by thread
// This test should FAIL initially (RED phase)

const tempDir = path.join(__dirname, 'temp-matrix-test');
const docsDir = path.join(tempDir, 'docs');
const specsDir = path.join(docsDir, 'specs');
const testThread = 'test-thread-linking';
const testThreadDir = path.join(specsDir, testThread);

function createTestFiles() {
    // Clean up and create test directory structure
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
    }
    fs.mkdirSync(tempDir);
    fs.mkdirSync(docsDir);
    fs.mkdirSync(specsDir);
    fs.mkdirSync(testThreadDir);

    // Create spec file with thread and matrix_ids
    const specContent = `---
thread: ${testThread}
matrix_ids: [PRD-101, SDS-201]
---

# Feature Specification

## What
A test feature for thread linking.

## Why
To test the traceability matrix thread linking functionality.

Referenced spec IDs: PRD-101, SDS-201
`;

    // Create plan file with same thread and additional matrix_ids
    const planContent = `---
thread: ${testThread}
matrix_ids: [PRD-101, TS-301]
---

# Implementation Plan

## TDD Cycles
- Cycle 1: Test implementation
- References: PRD-101, TS-301
`;

    // Create tasks file with same thread and additional matrix_ids
    const tasksContent = `---
thread: ${testThread}
matrix_ids: [SDS-201, TS-301, TASK-401]
---

# Tasks

## Tasks List
1. [ ] Implement feature
2. [ ] Write tests

Referenced IDs: SDS-201, TS-301, TASK-401
`;

    fs.writeFileSync(path.join(testThreadDir, 'spec.md'), specContent);
    fs.writeFileSync(path.join(testThreadDir, 'plan.adr.md'), planContent);
    fs.writeFileSync(path.join(testThreadDir, 'tasks.md'), tasksContent);
}

function cleanupTestFiles() {
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
    }
}

// Test thread linking functionality
try {
    createTestFiles();

    const matrix = buildMatrix(tempDir);

    // The test should verify that:
    // 1. Spec IDs from matrix_ids are extracted and linked to their source files
    // 2. Files with the same thread are grouped together
    // 3. Multiple matrix_ids from different files with same thread are aggregated

    // Find the row for PRD-101 (should appear in both spec and plan)
    const prdRow = matrix.find(row => row.id === 'PRD-101');
    assert.ok(prdRow, 'PRD-101 should be found in matrix');

    // Check that PRD-101 is linked to both spec and plan files from the same thread
    const expectedArtifacts = [
        `docs/specs/${testThread}/spec.md`,
        `docs/specs/${testThread}/plan.adr.md`
    ];

    for (const artifact of expectedArtifacts) {
        assert.ok(prdRow.artifacts.includes(artifact),
            `PRD-101 should reference ${artifact}. Found: ${prdRow.artifacts.join(', ')}`);
    }

    // Find SDS-201 (should appear in spec and tasks)
    const sdsRow = matrix.find(row => row.id === 'SDS-201');
    assert.ok(sdsRow, 'SDS-201 should be found in matrix');

    const expectedSdsArtifacts = [
        `docs/specs/${testThread}/spec.md`,
        `docs/specs/${testThread}/tasks.md`
    ];

    for (const artifact of expectedSdsArtifacts) {
        assert.ok(sdsRow.artifacts.includes(artifact),
            `SDS-201 should reference ${artifact}. Found: ${sdsRow.artifacts.join(', ')}`);
    }

    // Find TS-301 (should appear in plan and tasks)
    const tsRow = matrix.find(row => row.id === 'TS-301');
    assert.ok(tsRow, 'TS-301 should be found in matrix');

    const expectedTsArtifacts = [
        `docs/specs/${testThread}/plan.adr.md`,
        `docs/specs/${testThread}/tasks.md`
    ];

    for (const artifact of expectedTsArtifacts) {
        assert.ok(tsRow.artifacts.includes(artifact),
            `TS-301 should reference ${artifact}. Found: ${tsRow.artifacts.join(', ')}`);
    }

    // Find TASK-401 (should appear only in tasks)
    const taskRow = matrix.find(row => row.id === 'TASK-401');
    assert.ok(taskRow, 'TASK-401 should be found in matrix');
    assert.ok(taskRow.artifacts.includes(`docs/specs/${testThread}/tasks.md`),
        `TASK-401 should reference tasks.md. Found: ${taskRow.artifacts.join(', ')}`);

    console.log('✓ All thread linking tests passed');

} catch (error) {
    console.error('✗ Test failed as expected (RED phase):', error.message);
    throw error; // Re-throw to ensure test fails
} finally {
    cleanupTestFiles();
}
