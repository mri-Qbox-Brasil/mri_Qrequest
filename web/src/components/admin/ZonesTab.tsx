import {
  MriCard,
  MriCardContent,
  MriButton,
  MriInput,
  MriNumberInput,
  MriSettingField,
} from "@mriqbox/ui-kit";
import { useI18n } from "../../i18n";
import { fetchNui } from "../../utils/fetchNui";
import { isEnvBrowser } from "../../utils/misc";
import { AdminConfig, Coords, HuntingZone, NoDispatchZone } from "../../types/admin";

interface TabProps {
  config: AdminConfig;
  update: (patch: Partial<AdminConfig>) => void;
}

interface MyCoords extends Coords {
  heading: number;
}

async function getMyCoords(): Promise<MyCoords> {
  if (isEnvBrowser()) return { x: 0, y: 0, z: 0, heading: 0 };
  return fetchNui<MyCoords>("adminGetMyCoords", {}, { x: 0, y: 0, z: 0, heading: 0 });
}

const round = (n: number) => Math.round(n * 100) / 100;

const CoordsEditor: React.FC<{
  coords: Coords;
  onChange: (c: Coords) => void;
  onHere: () => void;
}> = ({ coords, onChange, onHere }) => {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{t("zones.coords")}</span>
        <MriButton variant="outline" size="sm" onClick={onHere}>
          {t("zones.here")}
        </MriButton>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["x", "y", "z"] as const).map((axis) => (
          <MriInput
            key={axis}
            size="sm"
            value={String(coords[axis] ?? 0)}
            onChange={(e) => onChange({ ...coords, [axis]: Number(e.target.value) || 0 })}
            leftIcon={<span className="text-[10px] uppercase">{axis}</span>}
          />
        ))}
      </div>
    </div>
  );
};

const ZonesTab: React.FC<TabProps> = ({ config, update }) => {
  const { t } = useI18n();
  const hunting: HuntingZone[] = (config.Locations.HuntingZones as HuntingZone[]) || [];
  const noDispatch: NoDispatchZone[] = (config.Locations.NoDispatchZones as NoDispatchZone[]) || [];

  const setLoc = (patch: Partial<AdminConfig["Locations"]>) =>
    update({ Locations: { ...config.Locations, ...patch } });

  const setHunting = (list: HuntingZone[]) => setLoc({ HuntingZones: list });
  const setNoDispatch = (list: NoDispatchZone[]) => setLoc({ NoDispatchZones: list });

  const patchAt = <T,>(list: T[], i: number, p: Partial<T>): T[] =>
    list.map((item, idx) => (idx === i ? { ...item, ...p } : item));

  return (
    <div className="space-y-8">
      {/* Hunting zones */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">{t("zones.hunting")}</h2>
            <p className="text-xs text-muted-foreground">{t("zones.hunting_desc")}</p>
          </div>
          <MriButton
            variant="default"
            size="sm"
            onClick={() =>
              setHunting([...hunting, { label: "Zone", radius: 100, coords: { x: 0, y: 0, z: 0 } }])
            }
          >
            + {t("zones.add")}
          </MriButton>
        </div>
        {hunting.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("zones.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {hunting.map((z, i) => (
              <MriCard key={i}>
                <MriCardContent className="space-y-3 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <MriInput
                      value={z.label ?? ""}
                      onChange={(e) => setHunting(patchAt(hunting, i, { label: e.target.value }))}
                      placeholder={t("zones.label")}
                    />
                    <MriButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setHunting(hunting.filter((_, idx) => idx !== i))}
                    >
                      <span className="text-destructive">{t("common.remove")}</span>
                    </MriButton>
                  </div>
                  <MriSettingField label={t("zones.radius")} layout="inline">
                    <MriNumberInput
                      value={z.radius}
                      onChange={(v) => setHunting(patchAt(hunting, i, { radius: v }))}
                      min={1}
                      max={2000}
                      step={10}
                    />
                  </MriSettingField>
                  <CoordsEditor
                    coords={z.coords}
                    onChange={(c) => setHunting(patchAt(hunting, i, { coords: c }))}
                    onHere={async () => {
                      const c = await getMyCoords();
                      setHunting(
                        patchAt(hunting, i, {
                          coords: { x: round(c.x), y: round(c.y), z: round(c.z) },
                        }),
                      );
                    }}
                  />
                </MriCardContent>
              </MriCard>
            ))}
          </div>
        )}
      </section>

      {/* No-dispatch zones */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">{t("zones.nodispatch")}</h2>
            <p className="text-xs text-muted-foreground">{t("zones.nodispatch_desc")}</p>
          </div>
          <MriButton
            variant="default"
            size="sm"
            onClick={() =>
              setNoDispatch([
                ...noDispatch,
                {
                  label: "Zone",
                  coords: { x: 0, y: 0, z: 0 },
                  length: 10,
                  width: 10,
                  heading: 0,
                  minZ: 0,
                  maxZ: 5,
                },
              ])
            }
          >
            + {t("zones.add")}
          </MriButton>
        </div>
        {noDispatch.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("zones.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {noDispatch.map((z, i) => (
              <MriCard key={i}>
                <MriCardContent className="space-y-3 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <MriInput
                      value={z.label ?? ""}
                      onChange={(e) =>
                        setNoDispatch(patchAt(noDispatch, i, { label: e.target.value }))
                      }
                      placeholder={t("zones.label")}
                    />
                    <MriButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setNoDispatch(noDispatch.filter((_, idx) => idx !== i))}
                    >
                      <span className="text-destructive">{t("common.remove")}</span>
                    </MriButton>
                  </div>
                  <CoordsEditor
                    coords={z.coords}
                    onChange={(c) => setNoDispatch(patchAt(noDispatch, i, { coords: c }))}
                    onHere={async () => {
                      const c = await getMyCoords();
                      setNoDispatch(
                        patchAt(noDispatch, i, {
                          coords: { x: round(c.x), y: round(c.y), z: round(c.z) },
                          heading: round(c.heading),
                        }),
                      );
                    }}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["length", t("zones.length")],
                        ["width", t("zones.width")],
                        ["heading", t("zones.heading")],
                        ["minZ", t("zones.minz")],
                        ["maxZ", t("zones.maxz")],
                      ] as Array<[keyof NoDispatchZone, string]>
                    ).map(([field, label]) => (
                      <MriSettingField key={String(field)} label={label}>
                        <MriNumberInput
                          value={Number(z[field]) || 0}
                          onChange={(v) =>
                            setNoDispatch(
                              patchAt(noDispatch, i, { [field]: v } as Partial<NoDispatchZone>),
                            )
                          }
                          min={-1000}
                          max={1000}
                          step={1}
                        />
                      </MriSettingField>
                    ))}
                  </div>
                </MriCardContent>
              </MriCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ZonesTab;
