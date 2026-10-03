// Detecta se o plugin está rodando dentro do mri_Qadmin (embedded) ou
// standalone (NUI própria aberta via /dispatchadmin).
//
// IMPORTANTE: NÃO usar `window.self !== window.top` no FiveM — toda NUI do
// FiveM já roda dentro de um iframe do CEF, então isso daria true mesmo em
// standalone, travando o plugin em loading eterno esperando um init que nunca
// vem. Sinal confiável: query param `?embedded=1` que o Qadmin injeta na URL.

export const useIsEmbedded = (): boolean => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("embedded") === "1";
};
