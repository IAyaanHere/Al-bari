import { IDriveAdapter } from "./types";
import { GoogleDriveAdapter } from "./google";
import { MockDriveAdapter } from "./mock";

let cachedAdapter: IDriveAdapter | null = null;

export function getDriveAdapter(): IDriveAdapter {
  if (cachedAdapter) {
    return cachedAdapter;
  }

  const isMock = process.env.MOCK_DRIVE === "true";

  if (isMock) {
    cachedAdapter = new MockDriveAdapter();
    return cachedAdapter;
  }

  // Real production adapter
  try {
    cachedAdapter = new GoogleDriveAdapter();
    return cachedAdapter;
  } catch (error: any) {
    console.error("Failed to initialize Google Drive Adapter:", error?.message || error);
    throw error;
  }
}
