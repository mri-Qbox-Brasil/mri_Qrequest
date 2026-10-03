// Contrato compartilhado entre mri_Qadmin (host) e plugins guest. Drift control:
// este arquivo deve bater 1:1 com a cópia em
// mri_Qadmin/web/src/plugin/types.ts. Mudanças aqui são breaking pro
// ecossistema — bump pequeno (eg adicionar campo opcional) ok, rename/remove
// quebra plugins existentes.

/** Manifest enviado pelo plugin no boot do server. */
export interface MriPluginManifest {
  /** Identificador único (kebab-case). Usado no route do Qadmin como `plugin:{id}`. */
  id: string;
  /** Texto exibido no sidebar. */
  label: string;
  /** Nome de ícone lucide-react (eg 'map-pin', 'sword', 'box'). */
  icon: string;
  /** Nome do resource FiveM. Usado pra montar a URL do iframe. */
  resource: string;
  /** Path do HTML buildado dentro do resource. Default `web/build/index.html`. */
  htmlPath?: string;
  /** ACE perms que liberam o plugin. Semântica OR. */
  requiredPerms?: string[];
  /** Definições de permissões gerenciáveis pelo Qadmin (exibidas na UI de perms). */
  permDefs?: Array<{ id: string; label?: string; desc?: string; category?: string }>;
  /** Descrição curta opcional. */
  description?: string;
}

/** Mensagens que o host (Qadmin) envia pro plugin via postMessage. */
export type MriPluginHostMessage =
  | {
      type: "mri-plugin/init";
      accentColor: string;
      backgroundColor?: string;
      locale: string;
      perms: string[];
    }
  | {
      type: "mri-plugin/theme-changed";
      accentColor: string;
      backgroundColor?: string;
    }
  | { type: "mri-plugin/perms-changed"; perms: string[] }
  | { type: "mri-plugin/close" };

/** Mensagens que o plugin guest envia pro host (Qadmin). */
export type MriPluginGuestMessage =
  | { type: "mri-plugin/ready" }
  | { type: "mri-plugin/request-close" };

/** Type guard pra distinguir msgs do nosso protocolo de outros postMessages. */
export const isMriPluginMessage = (
  data: unknown,
): data is MriPluginHostMessage | MriPluginGuestMessage => {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    typeof (data as { type: unknown }).type === "string" &&
    (data as { type: string }).type.startsWith("mri-plugin/")
  );
};
