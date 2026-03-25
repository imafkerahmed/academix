"use client";

import React, { useState, useEffect } from "react";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";
import { Loader2, Layout, Save } from "lucide-react";

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  
  const [institutionName, setInstitutionName] = useState("Academix");
  const [supportEmail, setSupportEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const records = await pb.collection("institution_settings").getFullList();
        if (records.length > 0) {
          const s = records[0];
          setSettingsId(s.id);
          setInstitutionName(s.institution_name || "Academix");
          setSupportEmail(s.support_email || "");
          setTimezone(s.timezone || "UTC");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        institution_name: institutionName,
        support_email: supportEmail,
        timezone,
      };

      if (settingsId) {
        await pb.collection("institution_settings").update(settingsId, data);
      } else {
        const record = await pb.collection("institution_settings").create(data);
        setSettingsId(record.id);
      }
      toast.success("General configuration updated securely.");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to update general settings. Are the fields created in PocketBase?");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <Layout size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              General <span className="text-indigo-600">Settings</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
              Configure institution branding and global parameters
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hidden md:flex"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-8">
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
            Institution Name
          </label>
          <input
            type="text"
            className="w-full bg-gray-50 border-2 border-transparent p-5 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-gray-900"
            placeholder="e.g. Oxford University"
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
              Support Email
            </label>
            <input
              type="email"
              className="w-full bg-gray-50 border-2 border-transparent p-5 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-gray-900"
              placeholder="support@example.com"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
              System Timezone
            </label>
            <input
              type="text"
              className="w-full bg-gray-50 border-2 border-transparent p-5 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-gray-900"
              placeholder="e.g. UTC, Asia/Colombo"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mobile Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-6 py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed md:hidden"
      >
        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
        Save Changes
      </button>
    </div>
  );
}
