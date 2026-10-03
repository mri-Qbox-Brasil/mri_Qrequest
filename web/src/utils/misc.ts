// Will return whether the current environment is in a regular browser
// and not CEF.
//
// Nota: quando o NUI roda embutido no mri_Qadmin (iframe aninhado servido de
// `https://cfx-nui-<resource>/...`), o FiveM nem sempre injeta `invokeNative`
// nesse iframe. Sem o guard de hostname, isso cairia no modo browser e o painel
// mostraria dados mock em vez dos reais. O host `cfx-nui-*` é sinal confiável
// de que estamos no jogo.
export const isEnvBrowser = (): boolean => {
  if (typeof window === "undefined") return true;
  if (window.location.hostname.startsWith("cfx-nui-")) return false;
  return !(window as unknown as { invokeNative: unknown }).invokeNative;
};

// Basic no operation function
export const noop = () => {};
