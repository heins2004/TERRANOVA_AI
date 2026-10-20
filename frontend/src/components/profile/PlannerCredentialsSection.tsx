"use client";

import { useEffect, useRef, useState } from "react";
import {
  CredentialStatus,
  getPlannerCredentials,
  getPlannerDocumentUrl,
  PlannerCredential,
  submitPlannerCredentials,
} from "@/services/plannerCredentials";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
const REG_REGEX = /^[a-zA-Z0-9/\-\s]{5,60}$/;

export function PlannerCredentialsSection() {
  const [data, setData] = useState<PlannerCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [regNumber, setRegNumber] = useState("");
  const [bodyName, setBodyName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [regError, setRegError] = useState("");
  const [fileError, setFileError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    getPlannerCredentials()
      .then((res) => {
        if (active) {
          setData(res);
          if (res.registration_number) setRegNumber(res.registration_number);
          if (res.body_name) setBodyName(res.body_name);
        }
      })
      .catch((err) => { if (active) setGlobalError(err instanceof Error ? err.message : "Failed to load credentials."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    setGlobalError("");
    const file = e.target.files?.[0];
    if (!file) { setSelectedFile(null); return; }
    if (file.size === 0) { setFileError("Document file cannot be empty."); setSelectedFile(null); return; }
    if (file.size > MAX_FILE_SIZE) { setFileError("File size exceeds the 5 MB limit."); setSelectedFile(null); return; }
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (![".pdf", ".jpg", ".jpeg", ".png"].includes(ext) || (file.type && !ALLOWED_TYPES.includes(file.type.toLowerCase()))) {
      setFileError("Invalid file type. Only PDF, JPG, and PNG files are accepted.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    let hasError = false;
    const cleanReg = regNumber.trim();
    if (!cleanReg) { setRegError("Registration number is required."); hasError = true; }
    else if (!REG_REGEX.test(cleanReg)) { setRegError("Must be 5 to 60 characters with only letters, numbers, spaces, slashes (/), and hyphens (-)."); hasError = true; }
    else { setRegError(""); }

    if (!selectedFile) { setFileError("Please select a verification document (PDF, JPG, or PNG up to 5 MB)."); hasError = true; }
    else { setFileError(""); }
    if (hasError) return;

    setSubmitting(true);
    setGlobalError("");
    setSuccessMsg("");

    try {
      const fd = new FormData();
      fd.append("registration_number", cleanReg);
      if (bodyName.trim()) fd.append("body_name", bodyName.trim());
      fd.append("file", selectedFile as File);

      const updated = await submitPlannerCredentials(fd);
      setData(updated);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccessMsg("Credentials submitted successfully! Your submission is now Pending administrator review.");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Failed to submit credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  const status = data?.status || "Unsubmitted";

  const renderBadge = (st: CredentialStatus) => {
    if (st === "Verified") return <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-[10px] py-[3px] font-data-mono text-[11px] font-semibold text-emerald-400">Verified</span>;
    if (st === "Pending") return <span className="rounded-full border border-primary/40 bg-primary/10 px-[10px] py-[3px] font-data-mono text-[11px] font-semibold text-primary">Pending Review</span>;
    if (st === "Rejected") return <span className="rounded-full border border-danger/40 bg-danger/10 px-[10px] py-[3px] font-data-mono text-[11px] font-semibold text-danger">Rejected</span>;
    return <span className="rounded-full border border-white/20 bg-white/5 px-[10px] py-[3px] font-data-mono text-[11px] font-semibold text-on-surface-variant">Unsubmitted</span>;
  };

  return (
    <section className="rounded-xl border border-white/10 bg-surface-container-lowest/90 p-[20px] sm:p-[24px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-white/10 pb-[16px]">
        <div>
          <div className="flex items-center gap-[8px]">
            <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
            <h3 className="font-sans text-[16px] font-bold text-white">Professional Credentials</h3>
          </div>
          <p className="mt-[4px] font-sans text-[13px] text-on-surface-variant">
            Official planner verification required to appear in government planner searches and receive project invites.
          </p>
        </div>
        <div>{renderBadge(status)}</div>
      </div>

      {loading ? (
        <div className="py-[32px] text-center font-data-mono text-[13px] text-on-surface-variant">Loading credentials...</div>
      ) : (
        <div className="mt-[20px] space-y-[20px]">
          {status === "Verified" && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-[16px] text-emerald-300">
              <div className="flex items-center gap-[8px] font-semibold text-[14px]">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Your professional credentials are verified</span>
              </div>
              <p className="mt-[6px] text-[13px] text-emerald-200/80">
                {data?.is_backfilled
                  ? "Your account was verified under legacy accreditation. You are eligible for all official invitations."
                  : `Registration: ${data?.registration_number || "Verified"} | Body: ${data?.body_name || "Statutory Board"}`}
              </p>
              {data?.document_original_name && (
                <div className="mt-[10px]">
                  <a href={getPlannerDocumentUrl()} download={data.document_original_name} className="inline-flex items-center gap-[6px] rounded border border-emerald-500/40 bg-emerald-500/20 px-[12px] py-[6px] font-data-mono text-[12px] text-emerald-300 hover:bg-emerald-500/30">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download {data.document_original_name}
                  </a>
                </div>
              )}
            </div>
          )}

          {status === "Rejected" && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 p-[16px] text-danger">
              <div className="flex items-center gap-[8px] font-semibold text-[14px]">
                <span className="material-symbols-outlined text-[20px]">cancel</span>
                <span>Credential submission was rejected</span>
              </div>
              <p className="mt-[6px] text-[13px] text-danger/90"><strong>Reason:</strong> {data?.rejection_reason || "Requirements not met."}</p>
              <p className="mt-[4px] text-[12px] text-on-surface-variant">You may correct your registration number and upload an updated document below to resubmit.</p>
            </div>
          )}

          {status === "Pending" && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-[16px] text-primary">
              <div className="flex items-center gap-[8px] font-semibold text-[14px]">
                <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                <span>Submission pending administrator review</span>
              </div>
              <p className="mt-[4px] text-[13px] text-on-surface-variant">
                Registration: {data?.registration_number} | Document: {data?.document_original_name} ({data?.document_size ? Math.round(data.document_size / 1024) : 0} KB)
              </p>
              {data?.document_original_name && (
                <div className="mt-[10px]">
                  <a href={getPlannerDocumentUrl()} download={data.document_original_name} className="inline-flex items-center gap-[6px] rounded border border-primary/40 bg-primary/20 px-[12px] py-[6px] font-data-mono text-[12px] text-primary hover:bg-primary/30">
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download submitted document
                  </a>
                </div>
              )}
            </div>
          )}

          {globalError && <div className="rounded border border-danger/40 bg-danger/10 p-[12px] text-danger text-[13px]">{globalError}</div>}
          {successMsg && <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-[12px] text-emerald-300 text-[13px]">{successMsg}</div>}

          {status !== "Verified" && (
            <form onSubmit={handleSubmit} className="space-y-[16px] border-t border-white/10 pt-[16px]">
              <h4 className="font-sans text-[14px] font-semibold text-white">
                {status === "Rejected" ? "Resubmit Credentials" : status === "Pending" ? "Update Pending Submission" : "Submit Credentials for Verification"}
              </h4>

              <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
                <div>
                  <label htmlFor="planner-reg-number" className="block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Registration Number *</label>
                  <input
                    id="planner-reg-number"
                    type="text"
                    value={regNumber}
                    onChange={(e) => { setRegNumber(e.target.value); if (regError) setRegError(""); }}
                    placeholder="e.g. ITPI/2024/0981 or CA/1234/A"
                    className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] text-[14px] text-white placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
                  />
                  {regError && <p className="mt-[4px] text-[12px] text-danger">{regError}</p>}
                </div>

                <div>
                  <label htmlFor="planner-body-name" className="block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Statutory / Professional Body (Optional)</label>
                  <input
                    id="planner-body-name"
                    type="text"
                    value={bodyName}
                    onChange={(e) => setBodyName(e.target.value)}
                    placeholder="e.g. Institute of Town Planners, India"
                    className="mt-[6px] w-full rounded border border-white/15 bg-surface-bright/20 px-[12px] py-[8px] text-[14px] text-white placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="planner-credential-file" className="block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">Registration Document * (PDF, JPG, PNG - Max 5 MB)</label>
                <input
                  id="planner-credential-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="mt-[6px] block w-full text-[13px] text-on-surface-variant file:mr-[12px] file:rounded file:border file:border-primary/40 file:bg-primary/10 file:px-[12px] file:py-[6px] file:font-data-mono file:text-[11px] file:font-semibold file:text-primary file:uppercase hover:file:bg-primary/20 cursor-pointer"
                />
                {fileError && <p className="mt-[4px] text-[12px] text-danger">{fileError}</p>}
                {selectedFile && <p className="mt-[4px] text-[12px] text-primary">Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</p>}
              </div>

              <div className="flex items-center gap-[12px] pt-[8px]">
                <button
                  type="submit"
                  id="planner-submit-credentials-btn"
                  disabled={submitting}
                  className="inline-flex items-center gap-[8px] rounded border border-primary bg-primary px-[18px] py-[9px] font-data-mono text-[12px] font-bold text-surface-container-lowest uppercase tracking-wider shadow hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <span className="h-[14px] w-[14px] animate-spin rounded-full border-2 border-surface-container-lowest border-t-transparent" />}
                  <span>{submitting ? "Uploading..." : status === "Rejected" ? "Resubmit Document" : "Submit for Verification"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
