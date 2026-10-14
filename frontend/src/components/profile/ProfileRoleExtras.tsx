"use client";

type ProfileRoleExtrasProps = {
  role: string;
  organization: string;
  setOrganization: (val: string) => void;
  designation: string;
  setDesignation: (val: string) => void;
  expertise: string;
  setExpertise: (val: string) => void;
  isLoading: boolean;
  fieldErrors: Record<string, string>;
};

export function ProfileRoleExtras({
  role,
  organization,
  setOrganization,
  designation,
  setDesignation,
  expertise,
  setExpertise,
  isLoading,
  fieldErrors,
}: ProfileRoleExtrasProps) {
  const isPlanner = role === "Urban Planner";
  const isOfficial = role === "Government Official";

  if (!isPlanner && !isOfficial) {
    return null;
  }

  return (
    <>
      {/* Organization */}
      <div className="flex flex-col gap-[6px]">
        <label
          htmlFor="profile-org-input"
          className="font-body-md text-[13px] font-medium text-on-surface"
        >
          Organization
        </label>
        <input
          id="profile-org-input"
          type="text"
          placeholder="e.g. Urban Development Authority"
          value={organization}
          disabled={isLoading}
          onChange={(e) => setOrganization(e.target.value)}
          className="h-[42px] rounded-lg border border-white/15 bg-white/5 px-[14px] font-body-md text-[13px] text-on-surface transition-all focus:border-primary-container focus:outline-none"
        />
        {fieldErrors.organization && (
          <p className="font-body-md text-[11px] text-danger">
            {fieldErrors.organization}
          </p>
        )}
      </div>

      {/* Designation for Official */}
      {isOfficial && (
        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="profile-desig-input"
            className="font-body-md text-[13px] font-medium text-on-surface"
          >
            Designation
          </label>
          <input
            id="profile-desig-input"
            type="text"
            placeholder="e.g. Municipal Director"
            value={designation}
            disabled={isLoading}
            onChange={(e) => setDesignation(e.target.value)}
            className="h-[42px] rounded-lg border border-white/15 bg-white/5 px-[14px] font-body-md text-[13px] text-on-surface transition-all focus:border-primary-container focus:outline-none"
          />
          {fieldErrors.designation && (
            <p className="font-body-md text-[11px] text-danger">
              {fieldErrors.designation}
            </p>
          )}
        </div>
      )}

      {/* Expertise for Planner */}
      {isPlanner && (
        <div className="flex flex-col gap-[6px] sm:col-span-2">
          <label
            htmlFor="profile-expertise-input"
            className="font-body-md text-[13px] font-medium text-on-surface"
          >
            Expertise
          </label>
          <textarea
            id="profile-expertise-input"
            rows={2}
            placeholder="e.g. Transit-oriented development, environmental zoning"
            value={expertise}
            disabled={isLoading}
            onChange={(e) => setExpertise(e.target.value)}
            className="rounded-lg border border-white/15 bg-white/5 p-[12px] font-body-md text-[13px] text-on-surface transition-all focus:border-primary-container focus:outline-none"
          />
          {fieldErrors.expertise && (
            <p className="font-body-md text-[11px] text-danger">
              {fieldErrors.expertise}
            </p>
          )}
        </div>
      )}
    </>
  );
}
