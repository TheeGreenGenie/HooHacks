"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useApiToken } from "../lib/hooks/useApiToken";
import { fetchMyProfile, updateMyProfile, UserProfile } from "../lib/api/users";

export default function ProfilePage() {
  const { user } = useUser();
  const token = useApiToken();

  const [profile, setProfile]   = useState<UserProfile>({});
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [error,   setError]     = useState("");

  // Form fields
  const [fullName,     setFullName]     = useState("");
  const [age,          setAge]          = useState("");
  const [phoneNumber,  setPhoneNumber]  = useState("");
  const [displayName,  setDisplayName]  = useState("");

  // Derive a sensible default name from the Auth0 email (part before @)
  const emailPrefix = user?.email?.split("@")[0] ?? "";

  useEffect(() => {
    if (!token) return;
    fetchMyProfile(token)
      .then((p) => {
        setProfile(p);
        setFullName(p.full_name     || emailPrefix);
        setAge(p.age != null        ? String(p.age) : "");
        setPhoneNumber(p.phone_number || "000-000-0000");
        setDisplayName(p.display_name ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, emailPrefix]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await updateMyProfile(token, {
        full_name:    fullName    || undefined,
        age:          age ? Number(age) : undefined,
        phone_number: phoneNumber || undefined,
        display_name: displayName || undefined,
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = {
    background: "rgba(20,8,0,0.65)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(217,119,6,0.18)",
    borderRadius: "1rem",
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(35,14,2,0.65)",
    border: "1px solid rgba(217,119,6,0.25)",
    borderRadius: "0.5rem",
    padding: "0.55rem 0.9rem",
    color: "#FDE68A",
    fontSize: "0.9rem",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: "#7A5030",
    marginBottom: "0.35rem",
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "5rem" }}>
      <div className="max-w-lg mx-auto px-5 sm:px-8 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          {/* Avatar circle */}
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{
              width: 80, height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #92400E, #B45309)",
              border: "2px solid rgba(217,119,6,0.4)",
              fontSize: "2rem",
            }}
          >
            {profile.full_name
              ? profile.full_name.charAt(0).toUpperCase()
              : (user?.name?.charAt(0).toUpperCase() ?? "🤠")}
          </div>

          <h1
            className="text-2xl font-bold tracking-wide"
            style={{ fontFamily: "Georgia, serif", color: "#E8C060" }}
          >
            {profile.full_name || user?.name || "Your Profile"}
          </h1>
          {user?.email && (
            <p className="text-sm mt-1" style={{ color: "#7A5030" }}>
              {user.email}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#D97706 transparent transparent transparent" }}
            />
          </div>
        ) : (
          <form onSubmit={handleSave} style={cardStyle} className="p-7 space-y-5">

            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jesse James"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Age</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 28"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 555-867-5309"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Display Name / Alias</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. The Kid"
                style={inputStyle}
              />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(217,119,6,0.12)" }} />

            {/* Read-only Auth0 info */}
            <div>
              <label style={labelStyle}>Email (from Auth0)</label>
              <p
                className="px-4 py-2 rounded-lg text-sm"
                style={{
                  background: "rgba(20,8,0,0.5)",
                  border: "1px solid rgba(217,119,6,0.1)",
                  color: "#9A7850",
                }}
              >
                {user?.email ?? "—"}
              </p>
            </div>

            {error && (
              <p
                className="text-sm px-3 py-2 rounded-lg"
                style={{ background: "rgba(127,29,29,0.3)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </p>
            )}

            {saved && (
              <p
                className="text-sm px-3 py-2 rounded-lg text-center font-semibold"
                style={{ background: "rgba(20,83,45,0.35)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)" }}
              >
                ✓ Profile saved
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-opacity"
              style={{
                background: "linear-gradient(135deg, #92400E, #B45309)",
                color: "#FDE68A",
                border: "1px solid rgba(217,119,6,0.4)",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
