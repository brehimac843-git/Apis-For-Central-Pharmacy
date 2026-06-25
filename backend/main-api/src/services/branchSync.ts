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
