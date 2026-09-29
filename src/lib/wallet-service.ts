import { apiClient } from "./api-client";

/** The legacy Mongo wallet is not financial truth in KEIBO. */
export async function releaseCharityMilestoneFunds(input: {
  projectId: string;
  milestoneId: string;
  idempotencyKey: string;
}) {
  const response = await apiClient.post(
    "/wallet/withdraw",
    { projectId: input.projectId, milestoneId: input.milestoneId },
    { headers: { "Idempotency-Key": input.idempotencyKey } },
  );
  return response.data;
}
