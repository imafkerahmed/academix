"use client";

import React, { useState, useEffect } from "react";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";
import { Loader2, DollarSign, Save, ChevronDown } from "lucide-react";
import AdminLoader from "@/components/admin/AdminLoader";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "LKR", symbol: "Rs", label: "Sri Lankan Rupee" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
];

export default function FinancialSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  
  const [currency, setCurrency] = useState("USD");
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [paymentInstructions, setPaymentInstructions] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const records = await pb.collection("institution_settings").getFullList();
        if (records.length > 0) {
          const s = records[0];
          setSettingsId(s.id);
          setCurrency(s.currency || "USD");
          setTaxPercentage(s.tax_percentage || 0);
          setPaymentInstructions(s.payment_instructions || "");
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
        currency,
        tax_percentage: taxPercentage,
        payment_instructions: paymentInstructions,
      };

      if (settingsId) {
        await pb.collection("institution_settings").update(settingsId, data);
      } else {
        const record = await pb.collection("institution_settings").create(data);
        setSettingsId(record.id);
      }
      toast.success("Financial configuration updated securely.");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to update financial settings. Are the fields created in PocketBase?");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-orange-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-orange-100 ring-8 ring-orange-50">
            <DollarSign size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Financial <span className="text-orange-600">Protocol</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
              Configure currencies, billing instructions, and fees
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-6 py-4 rounded-2xl bg-orange-600 text-white font-black uppercase tracking-widest shadow-xl shadow-orange-200 hover:bg-orange-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hidden md:flex"
        >
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          Save Changes
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm flex items-center justify-center">
          <AdminLoader inline={true} message="Loading Financial Protocol..." />
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
                Primary Currency Code
              </label>
              <div className="relative">
                <select
                  className="w-full bg-gray-50 border-2 border-transparent p-5 pr-14 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-gray-900 appearance-none cursor-pointer"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) - {c.label}
                    </option>
                  ))}
                  {/* Fallback for an existing custom currency not in the list */}
                  {!CURRENCIES.find((c) => c.code === currency) && (
                    <option value={currency}>{currency} (Custom)</option>
                  )}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown size={20} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Affects all global money rendering and financial stats.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
                Standard Tax Percentage
              </label>
              <input
                type="number"
                className="w-full bg-gray-50 border-2 border-transparent p-5 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-gray-900"
                placeholder="e.g. 15"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(parseFloat(e.target.value))}
                min={0}
                step={0.1}
              />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Default tax applied to new invoices if applicable
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">
              Payment Instructions & Bank Details
            </label>
            <textarea
              className="w-full min-h-[160px] bg-gray-50 border-2 border-transparent p-5 rounded-2xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold text-gray-900 resize-y"
              placeholder="Account Name: Academix Ltd.&#10;Account No: 123456789&#10;Bank: International Bank"
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
            />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
              Visible to students when they upload their payment slips
            </p>
          </div>
        </div>
      )}

      {/* Mobile Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || loading}
        className="w-full px-6 py-5 rounded-2xl bg-orange-600 text-white font-black uppercase tracking-widest shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed md:hidden"
      >
        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
        Save Changes
      </button>
    </div>
  );
}
