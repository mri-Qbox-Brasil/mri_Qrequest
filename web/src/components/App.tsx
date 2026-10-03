import { useState } from "react";
import RequestContainer from "./templates/RequestContainer";
import { ThemeProvider } from "../contexts/ThemeContext";
import { I18nProvider } from "../i18n";
import { useNuiEvent } from "../hooks/useNuiEvent";
import { useIsEmbedded } from "../plugin/useIsEmbedded";
import AdminPanel from "./admin/AdminPanel";

const App: React.FC = () => {
  const embedded = useIsEmbedded();
  const [adminOpen, setAdminOpen] = useState(false);

  // Comando /dispatchadmin (standalone) e evento de abertura empurram openAdmin.
  useNuiEvent("openAdmin", () => setAdminOpen(true));
  useNuiEvent("closeAdmin", () => setAdminOpen(false));

  const showAdmin = embedded || adminOpen;

  return (
    <I18nProvider>
      <ThemeProvider>
        {showAdmin ? (
          <AdminPanel embedded={embedded} onClose={() => setAdminOpen(false)} />
        ) : (
          <div className="h-full flex justify-start items-start text-left">
            <RequestContainer />
          </div>
        )}
      </ThemeProvider>
    </I18nProvider>
  );
};

export default App;
