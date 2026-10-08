"use client";

import { useState, useRef } from "react";
import { CreateOfficialPayload, AdminUser, createOfficial } from "@/services/admin";

type CreateOfficialModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (official: AdminUser) => void;
};

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export function CreateOfficialModal({ isOpen, onClose, onCreated }: CreateOfficialModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("bengaluru");
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubmittingRef = useRef(false);

  if (!isOpen) return null;

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    const cleanName = name.trim();
    if (!cleanName) {
      newErrors.name = "Official name cannot be blank.";
    } else if (/\d/.test(cleanName)) {
      newErrors.name = "Name cannot contain digits.";
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = "Enter a valid email address.";
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, "");
    if (cleanPhone) {
      const normalized = cleanPhone.startsWith("+91") ? cleanPhone.slice(3) : cleanPhone;
      if (!INDIAN_PHONE_REGEX.test(normalized)) {
        newErrors.phone = "Phone must be a 10-digit Indian number starting with 6-9.";
      }
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    setServerError("");

    if (!validate()) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload: CreateOfficialPayload = {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() ? phone.trim() : undefined,
        city: city ? city.trim().toLowerCase() : undefined,
      };

      const created = await createOfficial(payload);

      // Clear password and fields immediately - never display password again
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setServerError("");
      setErrors({});

      onCreated(created);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to create government official.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-black/70 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg rounded-[20px] p-[28px] border border-white/15 bg-surface/95 shadow-2xl relative">
        <div className="flex items-center justify-between pb-[16px] border-b border-white/10">
          <div>
            <span className="font-data-mono text-[11px] uppercase tracking-wider text-primary font-medium">
              Administrative Action
            </span>
            <h2 className="font-display-md text-[20px] font-bold text-foreground mt-[2px]">
              Create Government Official
            </h2>
          </div>
          <button
            type="button"
            id="close-create-official-modal-btn"
            onClick={onClose}
            aria-label="Close"
            className="text-on-surface-variant hover:text-foreground p-[6px] rounded-full hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {serverError && (
          <div
            id="create-official-server-error"
            className="mt-[16px] p-[12px] rounded-[10px] bg-danger/10 border border-danger/30 text-danger text-[12px] font-data-mono flex items-center gap-[8px]"
          >
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-[20px] space-y-[16px]" noValidate>
          {/* Name Field */}
          <div>
            <label htmlFor="official-name-input" className="block text-[12px] font-data-mono text-on-surface-variant mb-[6px]">
              Full Name <span className="text-danger">* (No digits)</span>
            </label>
            <input
              id="official-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="e.g. Ramesh Kumar"
              className="w-full h-[40px] px-[12px] rounded-[8px] bg-surface-muted/60 border border-white/15 text-foreground font-sans text-[13px] placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.name && (
              <p id="official-name-error" className="mt-[4px] text-[11px] font-data-mono text-danger">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="official-email-input" className="block text-[12px] font-data-mono text-on-surface-variant mb-[6px]">
              Official Email <span className="text-danger">*</span>
            </label>
            <input
              id="official-email-input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="e.g. ramesh.kumar@gov.in"
              className="w-full h-[40px] px-[12px] rounded-[8px] bg-surface-muted/60 border border-white/15 text-foreground font-sans text-[13px] placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.email && (
              <p id="official-email-error" className="mt-[4px] text-[11px] font-data-mono text-danger">
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="official-phone-input" className="block text-[12px] font-data-mono text-on-surface-variant mb-[6px]">
              Indian Phone Number <span className="text-on-surface-variant/60">(Optional: 10 digits starting 6-9)</span>
            </label>
            <input
              id="official-phone-input"
              type="text"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
              }}
              placeholder="e.g. 9876543210"
              className="w-full h-[40px] px-[12px] rounded-[8px] bg-surface-muted/60 border border-white/15 text-foreground font-sans text-[13px] placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.phone && (
              <p id="official-phone-error" className="mt-[4px] text-[11px] font-data-mono text-danger">
                {errors.phone}
              </p>
            )}
          </div>

          {/* City Selection */}
          <div>
            <label htmlFor="official-city-input" className="block text-[12px] font-data-mono text-on-surface-variant mb-[6px]">
              Jurisdiction City
            </label>
            <select
              id="official-city-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full h-[40px] px-[12px] rounded-[8px] bg-surface-muted/60 border border-white/15 text-foreground font-sans text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="bengaluru">Bengaluru</option>
              <option value="mumbai">Mumbai</option>
              <option value="delhi">Delhi</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="chennai">Chennai</option>
            </select>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="official-password-input" className="block text-[12px] font-data-mono text-on-surface-variant mb-[6px]">
              Temporary Password <span className="text-danger">* (Min 8 characters)</span>
            </label>
            <input
              id="official-password-input"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="••••••••"
              className="w-full h-[40px] px-[12px] rounded-[8px] bg-surface-muted/60 border border-white/15 text-foreground font-sans text-[13px] placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.password && (
              <p id="official-password-error" className="mt-[4px] text-[11px] font-data-mono text-danger">
                {errors.password}
              </p>
            )}
            <p className="mt-[4px] text-[11px] font-data-mono text-on-surface-variant/70">
              Note: Password will not be displayed or retrievable after creation.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-[16px] flex items-center justify-end gap-[12px] border-t border-white/10">
            <button
              type="button"
              id="cancel-create-official-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-[36px] px-[16px] rounded-[8px] border border-white/15 bg-white/5 text-on-surface-variant hover:text-foreground font-data-mono text-[12px] tracking-wider uppercase transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="create-official-submit-btn"
              disabled={isSubmitting}
              className="h-[36px] px-[20px] rounded-[8px] border border-primary/60 bg-primary/20 text-primary hover:bg-primary/30 font-data-mono text-[12px] font-semibold tracking-wider uppercase shadow-[0_0_15px_rgba(34,211,238,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Official"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
