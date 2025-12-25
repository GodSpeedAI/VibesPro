#!/usr/bin/env node
/**
 * Validate no circular dependencies in Nx dependency graph.
 *
 * Invariant: INV-05 - No circular dependencies in generated libs
 *
 * Usage:
 *   node scripts/validate-no-cycles.js .tmp/dep-graph.json [project-name]
 *
 * Traceability: AI_ADR-001, AI_SDS-001
 */

const fs = require('node:fs');
const path = require('node:path');

/**
 * Detect cycles in a directed graph using DFS.
 *
 * @param {Object} graph - Adjacency list representation
 * @param {string} startNode - Node to check for cycles from
 * @returns {string[]|null} - Cycle path if found, null otherwise
 */
function detectCycle(graph, startNode) {
  const visited = new Set();
  const recursionStack = new Set();
  const parent = new Map();

  function dfs(node, path) {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        parent.set(neighbor, node);
        const cycle = dfs(neighbor, [...path, neighbor]);
        if (cycle) return cycle;
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle - build the cycle path
        const cycleStart = path.indexOf(neighbor);
        return path.slice(cycleStart).concat(neighbor);
      }
    }

    recursionStack.delete(node);
    return null;
  }

  return dfs(startNode, [startNode]);
}

/**
 * Build adjacency list from Nx graph JSON.
 *
 * @param {Object} nxGraph - Nx dependency graph
 * @returns {Object} - Adjacency list
 */
function buildAdjacencyList(nxGraph) {
  const adjacencyList = {};

  // Handle both old and new Nx graph formats
  const dependencies = nxGraph.dependencies || nxGraph.graph?.dependencies || {};

  for (const [project, deps] of Object.entries(dependencies)) {
    adjacencyList[project] = deps.map((d) => (typeof d === 'string' ? d : d.target));
  }

  return adjacencyList;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node validate-no-cycles.js <graph-file> [project-name]');
    process.exit(1);
  }

  const graphFile = args[0];
  const focusProject = args[1];

  if (!fs.existsSync(graphFile)) {
    console.error(`Graph file not found: ${graphFile}`);
    process.exit(1);
  }

  const graphData = JSON.parse(fs.readFileSync(graphFile, 'utf-8'));
  const adjacencyList = buildAdjacencyList(graphData);

  // Check for cycles
  const projectsToCheck = focusProject ? [focusProject] : Object.keys(adjacencyList);
  let hasCycles = false;

  for (const project of projectsToCheck) {
    if (!adjacencyList[project]) {
      console.warn(`Project '${project}' not found in graph`);
      continue;
    }

    const cycle = detectCycle(adjacencyList, project);
    if (cycle) {
      console.error(`❌ Cycle detected: ${cycle.join(' → ')}`);
      hasCycles = true;
    }
  }

  if (hasCycles) {
    console.error('\n❌ INV-05 FAILED: Circular dependencies detected');
    process.exit(1);
  }

  console.log('✅ No circular dependencies detected');
  process.exit(0);
}

main();
