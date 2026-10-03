import { useState } from "react";
import { MriCard, MriCardContent, MriButton, MriInput, MriBadge } from "@mriqbox/ui-kit";
import { useI18n } from "../../i18n";
import { AdminConfig } from "../../types/admin";

interface TabProps {
  config: AdminConfig;
  update: (patch: Partial<AdminConfig>) => void;
}

const JobsTab: React.FC<TabProps> = ({ config, update }) => {
  const { t } = useI18n();
  const mapping = config.JobMapping;
  const [newGroup, setNewGroup] = useState("");
  const [jobDrafts, setJobDrafts] = useState<Record<string, string>>({});

  const commit = (next: Record<string, string[]>) => update({ JobMapping: next });

  const addGroup = () => {
    const g = newGroup.trim();
    if (!g || mapping[g]) return;
    commit({ ...mapping, [g]: [] });
    setNewGroup("");
  };

  const removeGroup = (group: string) => {
    const next = { ...mapping };
    delete next[group];
    commit(next);
  };

  const addJob = (group: string) => {
    const job = (jobDrafts[group] || "").trim();
    if (!job || mapping[group].includes(job)) return;
    commit({ ...mapping, [group]: [...mapping[group], job] });
    setJobDrafts((d) => ({ ...d, [group]: "" }));
  };

  const removeJob = (group: string, job: string) => {
    commit({ ...mapping, [group]: mapping[group].filter((j) => j !== job) });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold">{t("jobs.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("jobs.desc")}</p>
      </div>

      <div className="flex items-center gap-2">
        <MriInput
          className="w-64"
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGroup()}
          placeholder={t("jobs.group_placeholder")}
        />
        <MriButton variant="default" size="sm" onClick={addGroup}>
          + {t("jobs.add_group")}
        </MriButton>
      </div>

      {Object.keys(mapping).length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("jobs.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(mapping).map(([group, jobs]) => (
            <MriCard key={group}>
              <MriCardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">{group}</span>
                  <MriButton variant="ghost" size="sm" onClick={() => removeGroup(group)}>
                    <span className="text-destructive">{t("common.remove")}</span>
                  </MriButton>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {jobs.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                  {jobs.map((job) => (
                    <MriBadge key={job} variant="secondary" className="gap-1">
                      {job}
                      <button
                        className="ml-1 text-muted-foreground hover:text-destructive"
                        onClick={() => removeJob(group, job)}
                      >
                        ×
                      </button>
                    </MriBadge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <MriInput
                    size="sm"
                    value={jobDrafts[group] || ""}
                    onChange={(e) => setJobDrafts((d) => ({ ...d, [group]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addJob(group)}
                    placeholder={t("jobs.job_placeholder")}
                  />
                  <MriButton variant="outline" size="sm" onClick={() => addJob(group)}>
                    {t("common.add")}
                  </MriButton>
                </div>
              </MriCardContent>
            </MriCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsTab;
