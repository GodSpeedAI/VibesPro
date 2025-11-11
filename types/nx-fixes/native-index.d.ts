// Stub definitions to avoid TypeScript errors when consuming Nx native bindings.
declare module 'nx/src/native/index' {
  export class ExternalObject<T = unknown> {
    // Internal native handle placeholder
    private readonly __value: T;
  }

  export class AppLifeCycle {}
  export class ChildProcess {}
  export class FileLock {}
  export class HashPlanInspector {}
  export class HashPlanner {}
  export class HttpRemoteCache {}
  export class ImportResult {}
  export class NxCache {}
  export class NxConsolePreferences {}
  export class NxTaskHistory {}
  export class RunningTasksService {}
  export class RustPseudoTerminal {}
  export class TaskDetails {}
  export class TaskHasher {}
  export class Watcher {}
  export class WorkspaceContext {}

  export type ParserArc = unknown;
  export type WriterArc = unknown;
  export type HashInstruction = unknown;
  export type NxDbConnection = unknown;
  export type ProjectFiles = unknown;
  export type ProjectRootMappings = unknown;
  export type JsInputs = unknown;
  export type RunMode = unknown;
  export type TuiCliArgs = unknown;
  export type TuiConfig = unknown;
  export type Task = unknown;
  export type TaskGraph = unknown;
  export type TaskResult = unknown;
  export type TaskStatus = 'pending' | 'success' | 'failure' | string;
  export type TaskTarget = unknown;
  export type HasherOptions = Record<string, unknown>;
  export type NxJson = Record<string, unknown>;
  export type ProjectGraph = Record<string, unknown>;
  export type FileData = { file: string; hash: string };
  export type NxWorkspaceFiles = Record<string, unknown>;
  export type WatchEvent = {
    type: 'create' | 'update' | 'delete';
    path: string;
  };

  export interface CachedResult {
    code: number;
    terminalOutput?: string;
    outputsPath: string;
    size?: number;
  }

  export function canInstallNxConsole(): boolean;
  export function canInstallNxConsoleForEditor(editor: string): boolean;
  export function closeDbConnection(connection: ExternalObject<NxDbConnection>): void;
  export function connectToNxDb(
    cacheDir: string,
    nxVersion: string,
    dbName?: string | null,
  ): ExternalObject<NxDbConnection>;
  export function copy(src: string, dest: string): number;
  export function expandOutputs(directory: string, entries: Array<string>): Array<string>;
  export function hashArray(values: Array<string | undefined | null>): string;
  export function validateOutputs(outputs: Array<string>): void;
}
