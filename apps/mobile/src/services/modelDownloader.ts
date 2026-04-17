import * as FileSystem from "expo-file-system/legacy";
import { Paths, File, Directory } from "expo-file-system";

const MODELS_DIR_NAME = "llama-models";
const RESUME_DATA_FILENAME = "model-download-resume.json";

interface DownloadCallbacks {
  onProgress?: (downloaded: number, total: number) => void;
  onComplete?: (path: string) => void;
  onError?: (error: string) => void;
}

let activeDownload: FileSystem.DownloadResumable | null = null;

/**
 * Builds the HuggingFace download URL from a model ID.
 */
function getModelUrl(modelId: string): string {
  const parts = modelId.split("/");
  const filename = parts.pop()!;
  const repo = parts.join("/");
  return `https://huggingface.co/${repo}/resolve/main/${filename}?download=true`;
}

/**
 * Gets the model filename from a model ID.
 */
function getModelFilename(modelId: string): string {
  const parts = modelId.split("/");
  return parts.pop()!;
}

/**
 * Gets the models directory, creating it if needed.
 */
function getModelsDir(): Directory {
  const dir = new Directory(Paths.document, MODELS_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

/**
 * Gets the destination file URI for downloading (file:// format for expo-file-system).
 */
function getDestUri(modelId: string): string {
  const dir = getModelsDir();
  return new File(dir, getModelFilename(modelId)).uri;
}

/**
 * Gets the plain filesystem path for loading the model.
 * Native llama.cpp requires a plain path — NOT a file:// URI.
 */
export function getLocalModelPath(modelId: string): string {
  const uri = getDestUri(modelId);
  // Strip file:// prefix so native fopen() can resolve it
  return uri.replace(/^file:\/\//, "");
}

/**
 * Checks whether the model file exists on disk (using our download path).
 */
export async function isLocalModelDownloaded(modelId: string): Promise<boolean> {
  try {
    const dir = getModelsDir();
    const file = new File(dir, getModelFilename(modelId));
    return file.exists && file.size > 0;
  } catch {
    return false;
  }
}

// --- Resume data persistence ---

function getResumeDataFile(): File {
  return new File(Paths.document, RESUME_DATA_FILENAME);
}

function saveResumeData(data: string): void {
  const file = getResumeDataFile();
  if (!file.exists) {
    file.create();
  }
  file.write(data);
}

function loadResumeData(): string | null {
  const file = getResumeDataFile();
  if (!file.exists) return null;
  return file.textSync();
}

function deleteResumeData(): void {
  const file = getResumeDataFile();
  if (file.exists) {
    file.delete();
  }
}

/**
 * Start or resume a model download using expo-file-system's resumable API.
 * Persists resume data to a local file so downloads survive app restarts.
 */
export async function downloadModelResumable(
  modelId: string,
  callbacks: DownloadCallbacks
): Promise<string> {
  const url = getModelUrl(modelId);
  const destUri = getDestUri(modelId);

  // Ensure models dir exists
  getModelsDir();

  // Check if already fully downloaded
  const destFile = new File(destUri);
  if (destFile.exists && destFile.size > 0) {
    callbacks.onProgress?.(destFile.size, destFile.size);
    callbacks.onComplete?.(destUri);
    return destUri;
  }

  // Check for saved resume data from a previous interrupted download
  const savedResumeData = loadResumeData();

  const progressCallback: FileSystem.FileSystemNetworkTaskProgressCallback<FileSystem.DownloadProgressData> =
    (data) => {
      callbacks.onProgress?.(
        data.totalBytesWritten,
        data.totalBytesExpectedToWrite
      );
    };

  const download = FileSystem.createDownloadResumable(
    url,
    destUri,
    {},
    progressCallback,
    savedResumeData ?? undefined
  );

  activeDownload = download;

  try {
    const result = savedResumeData
      ? await download.resumeAsync()
      : await download.downloadAsync();

    // Clear persisted resume data on success
    deleteResumeData();
    activeDownload = null;

    if (result?.uri) {
      callbacks.onComplete?.(result.uri);
      return result.uri;
    }

    throw new Error("Download returned no result.");
  } catch (e) {
    activeDownload = null;
    const msg = e instanceof Error ? e.message : String(e);

    // Don't treat pause/cancel as an error
    if (msg.includes("cancel") || msg.includes("pause")) {
      throw e;
    }

    callbacks.onError?.(msg);
    throw e;
  }
}

/**
 * Pause the active download and persist resume data for later.
 */
export async function pauseModelDownload(): Promise<void> {
  if (!activeDownload) return;

  try {
    const pauseState = await activeDownload.pauseAsync();
    if (pauseState.resumeData) {
      saveResumeData(pauseState.resumeData);
    }
  } catch {
    // Best-effort pause
  }
  activeDownload = null;
}

/**
 * Whether a download is currently active.
 */
export function isDownloadActive(): boolean {
  return activeDownload !== null;
}

/**
 * Whether there's saved resume data from a previous interrupted download.
 */
export function hasSavedResumeData(): boolean {
  return loadResumeData() !== null;
}

/**
 * Clear any saved resume data (e.g., after model deletion).
 */
export function clearResumeData(): void {
  deleteResumeData();
}

/**
 * Delete the model file from disk.
 */
export function deleteLocalModel(modelId: string): void {
  const dir = getModelsDir();
  const file = new File(dir, getModelFilename(modelId));
  if (file.exists) {
    file.delete();
  }
}

/**
 * Delete all downloaded models and resume data (used by "Delete Everything").
 */
export function deleteAllModels(): void {
  const dir = new Directory(Paths.document, MODELS_DIR_NAME);
  if (dir.exists) {
    dir.delete();
  }
  deleteResumeData();
}
