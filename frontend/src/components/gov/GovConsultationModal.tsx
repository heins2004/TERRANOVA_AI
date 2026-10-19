"use client";

import React, { useState } from "react";
import {
  ProjectConsultation,
  ProjectConsultationCreatePayload,
  ProjectConsultationUpdatePayload,
  createProjectConsultation,
  updateProjectConsultation,
} from "@/services/projectConsultations";
import FullScreenMapModal from "@/components/maps/FullScreenMapModal";
import { GovConsultationVenueLocationSection } from "./GovConsultationVenueLocationSection";
export { GovConsultationCancelModal } from "./GovConsultationCancelModal";

interface FormModalProps {
  projectId: number;
  consultation: ProjectConsultation | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  city?: string;
}

export function GovConsultationFormModal({
  projectId,
  consultation,
  onClose,
  onSuccess,
  city,
}: FormModalProps) {
  const isEdit = consultation != null;
  const [title, setTitle] = useState(consultation?.title || "");
  const [description, setDescription] = useState(consultation?.description || "");
  const [startsAt, setStartsAt] = useState(() => {
    if (!consultation?.starts_at) return "";
    const d = new Date(consultation.starts_at);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState(String(consultation?.duration_minutes || 60));
  const [type, setType] = useState<"Online" | "Venue">(consultation?.type || "Online");
  const [meetingUrl, setMeetingUrl] = useState(consultation?.meeting_url || "");
  const [venueAddress, setVenueAddress] = useState(consultation?.venue_address || "");
  const [venueLat, setVenueLat] = useState<number | null>(consultation?.venue_lat ?? null);
  const [venueLng, setVenueLng] = useState<number | null>(consultation?.venue_lng ?? null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [initialPickerPin, setInitialPickerPin] = useState<[number, number] | null>(null);
  const [maxAttendees, setMaxAttendees] = useState(
    consultation?.max_attendees != null ? String(consultation.max_attendees) : ""
  );
  const [visibility, setVisibility] = useState<"Public" | "Private">(
    consultation?.visibility || "Public"
  );
  const [inviteEmailsText, setInviteEmailsText] = useState(
    consultation?.invite_emails ? consultation.invite_emails.join(", ") : (consultation?.invited_emails ? consultation.invited_emails.join(", ") : "")
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (title.trim().length < 3 || title.trim().length > 150) {
      errs.title = "Title must be between 3 and 150 characters.";
    }
    if (description.trim().length < 10 || description.trim().length > 2000) {
      errs.description = "Description must be between 10 and 2000 characters.";
    }
    if (!startsAt) {
      errs.starts_at = "Start time is required.";
    } else if (new Date(startsAt).getTime() <= Date.now()) {
      errs.starts_at = "Start time must be in the future.";
    }
    const durNum = Number(duration);
    if (isNaN(durNum) || durNum < 15 || durNum > 480) {
      errs.duration = "Duration must be between 15 and 480 minutes.";
    }
    if (type === "Online") {
      if (!meetingUrl.trim()) {
        errs.meeting_url = "Meeting URL is required for Online consultations.";
      } else if (!meetingUrl.trim().startsWith("https://")) {
        errs.meeting_url = "Meeting URL must start with https://";
      } else if (meetingUrl.trim().length > 500) {
        errs.meeting_url = "Meeting URL must not exceed 500 characters.";
      }
    } else {
      if (venueAddress.trim().length < 5 || venueAddress.trim().length > 300) {
        errs.venue_address = "Venue address must be between 5 and 300 characters.";
      }
    }
    if (maxAttendees.trim()) {
      const att = Number(maxAttendees);
      if (isNaN(att) || att < 1 || att > 100000) {
        errs.max_attendees = "Max attendees must be 1 to 100,000.";
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    const emailList = inviteEmailsText.split(/[\n,]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    try {
      const startsIso = new Date(startsAt).toISOString();
      const durNum = Number(duration);
      const attNum = maxAttendees.trim() ? Number(maxAttendees) : null;
      if (consultation) {
        const payload: ProjectConsultationUpdatePayload = {
          title: title.trim(),
          description: description.trim(),
          starts_at: startsIso,
          duration_minutes: durNum,
          type,
          meeting_url: type === "Online" ? meetingUrl.trim() : null,
          venue_address: type === "Venue" ? venueAddress.trim() : null,
          venue_lat: type === "Venue" ? venueLat : null,
          venue_lng: type === "Venue" ? venueLng : null,
          max_attendees: attNum,
          ...(visibility === "Private" ? { invite_emails: emailList } : {}),
        };
        const updated = await updateProjectConsultation(projectId, consultation.id, payload);
        onSuccess(`Consultation #${updated.id} updated successfully.`);
      } else {
        const payload: ProjectConsultationCreatePayload = {
          title: title.trim(),
          description: description.trim(),
          starts_at: startsIso,
          duration_minutes: durNum,
          type,
          meeting_url: type === "Online" ? meetingUrl.trim() : null,
          venue_address: type === "Venue" ? venueAddress.trim() : null,
          venue_lat: type === "Venue" ? venueLat : null,
          venue_lng: type === "Venue" ? venueLng : null,
          max_attendees: attNum,
          visibility,
          ...(visibility === "Private" ? { invite_emails: emailList } : {}),
        };
        const created = await createProjectConsultation(projectId, payload);
        onSuccess(`Consultation #${created.id} created successfully.`);
      }
    } catch (err) {
      setFieldErrors((prev) => ({ ...prev, form: err instanceof Error ? err.message : "Submission failed" }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-[16px] backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[16px] border border-white/20 bg-surface-container-lowest p-[24px] shadow-2xl">
          <h3 className="font-sans text-lg font-bold text-white">{isEdit ? `Edit Consultation #${consultation?.id}` : "New Consultation"}</h3>
          <form onSubmit={handleSubmit} className="mt-[16px] space-y-[12px]">
            {fieldErrors.form && <div className="text-xs text-red-400">{fieldErrors.form}</div>}
            <div>
              <label className="block font-data-mono text-xs uppercase text-on-surface-variant">Title (3-150)</label>
              <input id="consultation-form-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-[4px] w-full rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-sm text-white focus:border-cyan-400 focus:outline-none" />
              {fieldErrors.title && <p className="text-xs text-red-400 mt-[2px]">{fieldErrors.title}</p>}
            </div>
            <div>
              <label className="block font-data-mono text-xs uppercase text-on-surface-variant">Description (10-2000)</label>
              <textarea id="consultation-form-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-[4px] w-full rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-sm text-white focus:border-cyan-400 focus:outline-none" />
              {fieldErrors.description && <p className="text-xs text-red-400 mt-[2px]">{fieldErrors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-[12px]">
              <div>
                <label className="block font-data-mono text-xs uppercase text-on-surface-variant">Start Time</label>
                <input id="consultation-form-time" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-[4px] w-full rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-sm text-white focus:border-cyan-400 focus:outline-none" />
                {fieldErrors.starts_at && <p className="text-xs text-red-400 mt-[2px]">{fieldErrors.starts_at}</p>}
              </div>
              <div>
                <label className="block font-data-mono text-xs uppercase text-on-surface-variant">Duration (15-480 min)</label>
                <input id="consultation-form-duration" type="number" min={15} max={480} value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-[4px] w-full rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-sm text-white focus:border-cyan-400 focus:outline-none" />
                {fieldErrors.duration && <p className="text-xs text-red-400 mt-[2px]">{fieldErrors.duration}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[12px]">
              <div>
                <label className="block font-data-mono text-xs uppercase text-on-surface-variant">Type</label>
                <select
                  id="consultation-form-type"
                  value={type}
                  onChange={(e) => {
                    const nextType = e.target.value as "Online" | "Venue";
                    setType(nextType);
                    if (nextType === "Online") {
                      setVenueLat(null);
                      setVenueLng(null);
                    }
                  }}
                  className="mt-[4px] w-full rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Online">Online</option>
                  <option value="Venue">Venue</option>
                </select>
              </div>
              {!isEdit && (
                <div>
                  <label className="block font-data-mono text-xs uppercase text-on-surface-variant">Visibility</label>
                  <select id="consultation-form-vis" value={visibility} onChange={(e) => setVisibility(e.target.value as "Public" | "Private")} className="mt-[4px] w-full rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-sm text-white focus:border-cyan-400 focus:outline-none">
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              )}
            </div>
            {type === "Online" ? (
              <div>
                <label className="block font-data-mono text-xs uppercase text-on-surface-variant">Meeting URL (https://)</label>
                <input id="consultation-form-url" type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet.jit.si/..." className="mt-[4px] w-full rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-sm text-white focus:border-cyan-400 focus:outline-none" />
                {fieldErrors.meeting_url && <p className="text-xs text-red-400 mt-[2px]">{fieldErrors.meeting_url}</p>}
              </div>
            ) : (
              <div>
                <label className="block font-data-mono text-xs uppercase text-on-surface-variant">Venue Address (5-300)</label>
                <input id="consultation-form-addr" type="text" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder="Room 402, City Hall, ..." className="mt-[4px] w-full rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-sm text-white focus:border-cyan-400 focus:outline-none" />
                {fieldErrors.venue_address && <p className="text-xs text-red-400 mt-[2px]">{fieldErrors.venue_address}</p>}

                {/* Venue location on map row with paste and pick */}
                <GovConsultationVenueLocationSection
                  venueLat={venueLat}
                  venueLng={venueLng}
                  onClearPin={() => {
                    setVenueLat(null);
                    setVenueLng(null);
                  }}
                  onPickOnMap={() => {
                    setInitialPickerPin(venueLat != null && venueLng != null ? [venueLat, venueLng] : null);
                    setIsMapOpen(true);
                  }}
                  onOpenPickerWithPin={(pin) => {
                    setInitialPickerPin(pin);
                    setIsMapOpen(true);
                  }}
                />
              </div>
            )}
            <div>
              <label className="block font-data-mono text-xs uppercase text-on-surface-variant">Max Attendees (optional, 1-100000)</label>
              <input id="consultation-form-attendees" type="number" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="e.g. 50" className="mt-[4px] w-full rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-sm text-white focus:border-cyan-400 focus:outline-none" />
              {fieldErrors.max_attendees && <p className="text-xs text-red-400 mt-[2px]">{fieldErrors.max_attendees}</p>}
            </div>
            {visibility === "Private" && (
              <div>
                <label className="block font-data-mono text-xs uppercase text-on-surface-variant">Invite Citizen Emails (max 50, comma or newline separated)</label>
                <textarea id="consultation-form-invites" rows={3} value={inviteEmailsText} onChange={(e) => setInviteEmailsText(e.target.value)} placeholder="citizen1@example.com, citizen2@example.com" className="mt-[4px] w-full rounded border border-white/15 bg-black/40 px-[10px] py-[6px] text-sm text-white focus:border-cyan-400 focus:outline-none" />
              </div>
            )}
            <div className="flex justify-end gap-[10px] pt-[8px]">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded border border-white/20 px-[14px] py-[6px] text-xs text-white hover:bg-white/10">Cancel</button>
              <button id="consultation-form-submit-btn" type="submit" disabled={isSubmitting} className="rounded bg-cyan-600 px-[16px] py-[6px] text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50">{isSubmitting ? "Saving..." : (isEdit ? "Update" : "Create")}</button>
            </div>
          </form>
        </div>
      </div>

      {isMapOpen && (
        <FullScreenMapModal
          isOpen={isMapOpen}
          mode="venue_pin"
          city={city}
          initialPinLat={initialPickerPin ? initialPickerPin[0] : venueLat}
          initialPinLng={initialPickerPin ? initialPickerPin[1] : venueLng}
          onClose={() => {
            setIsMapOpen(false);
            setInitialPickerPin(null);
          }}
          onConfirm={(lat, lng) => {
            setVenueLat(lat);
            setVenueLng(lng);
            setIsMapOpen(false);
            setInitialPickerPin(null);
          }}
          triggerButtonId="consultation-pick-map-btn"
        />
      )}
    </>
  );
}
