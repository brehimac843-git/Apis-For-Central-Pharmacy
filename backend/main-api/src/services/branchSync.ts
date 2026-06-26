import axios from "axios";

const API_TIMEOUT = 4000;

export async function syncAgentCreate(apiUrl: string, agentNumber: string, agentName: string) {
  await axios.post(
    `${apiUrl}/api/internal/agents`,
    { agentNumber, agentName },
    { timeout: API_TIMEOUT }
  );
}

export async function syncAgentUpdate(
  apiUrl: string,
  agentNumber: string,
  agentName: string,
  isActive: boolean
) {
  await axios.put(
    `${apiUrl}/api/internal/agents/${encodeURIComponent(agentNumber)}`,
    { agentName, isActive },
    { timeout: API_TIMEOUT }
  );
}

export async function syncAgentDelete(apiUrl: string, agentNumber: string) {
  await axios.delete(`${apiUrl}/api/internal/agents/${encodeURIComponent(agentNumber)}`, {
    timeout: API_TIMEOUT,
  });
}

export function getBranchSyncWarning(err: unknown, pharmacyName?: string): string {
  const branch = pharmacyName ?? "The pharmacy branch";
  const axiosErr = err as { code?: string; response?: { status?: number } };

  if (
    axiosErr.code === "ECONNREFUSED" ||
    axiosErr.code === "ENOTFOUND" ||
    axiosErr.code === "ETIMEDOUT"
  ) {
    return `${branch} is not reachable. The change was saved here, but the branch may be out of sync until it is back online.`;
  }

  if (axiosErr.response?.status === 404) {
    return `${branch} could not apply this change. The change was saved here, but the branch may need to be restarted.`;
  }

  return `${branch} could not be updated. The change was saved here, but the branch may be out of sync.`;
}
