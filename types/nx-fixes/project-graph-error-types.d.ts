declare module 'nx/src/project-graph/error-types' {
  export class AggregateCreateNodesError extends Error {
    constructor(message?: string);
  }

  export class StaleProjectGraphCacheError extends Error {
    constructor(message?: string);
  }
}
