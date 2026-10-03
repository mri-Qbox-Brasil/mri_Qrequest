import { isEnvBrowser } from "./misc";

// Resolve o nome do resource FiveM pro endpoint da NUI callback.
// `GetParentResourceName` existe no frame do topo, mas costuma faltar no iframe
// aninhado do mri_Qadmin — nesse caso derivamos do host `cfx-nui-<resource>`
// (a URL que o Qadmin usa pra montar o iframe). Sem isso, o embedded chamaria
// um resource errado e o painel não carregaria os dados.
function getResourceName(): string {
  const w = window as unknown as { GetParentResourceName?: () => string };
  if (typeof w.GetParentResourceName === "function") {
    try {
      const name = w.GetParentResourceName();
      if (name) return name;
    } catch {
      /* ignore */
    }
  }
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (host.startsWith("cfx-nui-")) return host.slice("cfx-nui-".length);
  return "nui-frame-app";
}

/**
 * Simple wrapper around fetch API tailored for CEF/NUI use. This abstraction
 * can be extended to include AbortController if needed or if the response isn't
 * JSON. Tailor it to your needs.
 *
 * @param eventName - The endpoint eventname to target
 * @param data - Data you wish to send in the NUI Callback
 * @param mockData - Mock data to be returned if in the browser
 *
 * @return returnData - A promise for the data sent back by the NuiCallbacks CB argument
 */

export async function fetchNui<T = unknown>(
  eventName: string,
  data?: unknown,
  mockData?: T,
): Promise<T> {
  const options = {
    method: "post",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(data),
  };

  if (isEnvBrowser() && mockData) return mockData;

  // In browser (dev) avoid trying to call a non-existent `https://<resource>/...` endpoint.
  // If mockData provided, return it above; otherwise return an empty object to avoid network errors.
  if (isEnvBrowser()) return {} as T;

  const resourceName = getResourceName();

  const resp = await fetch(`https://${resourceName}/${eventName}`, options);

  const respFormatted = await resp.json();

  return respFormatted;
}
