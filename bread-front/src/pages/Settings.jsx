import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  User, MapPin, Store, CreditCard, Bell, Sparkles, LogOut,
  ChevronRight, Users, Save, Check, Info, TrendingUp, DollarSign, Trash2, AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLiveZip } from "@/lib/location";

const allStores = ["Walmart", "Kroger", "Costco", "Aldi", "Trader Joe's", "Whole Foods", "Target", "Publix", "H-E-B", "Safeway", "Harris Teeter", "Food Lion"];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [deleteStep, setDeleteStep] = useState(0); // 0=idle, 1=confirm, 2=deleting
  const navigate = useNavigate();

  // Editable fields
  const [zipCode, setZipCode] = useState("");
  const [useLiveLocation, setUseLiveLocation] = useState(false);
  const [detectingZip, setDetectingZip] = useState(false);
  const [preferredStores, setPreferredStores] = useState([]);
  const [householdSize, setHouseholdSize] = useState(1);
  const [householdMembers, setHouseholdMembers] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smartPricingEnabled, setSmartPricingEnabled] = useState(true);
  const [cookingSkill, setCookingSkill] = useState("beginner");

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setZipCode(u.zipcode || "");
      setUseLiveLocation(!!u.use_live_location);
      setPreferredStores(u.preferred_stores || []);
      setHouseholdSize(u.household_size || 1);
      setHouseholdMembers(u.household_members || []);
      setNotificationsEnabled(u.notifications_enabled !== false);
      setSmartPricingEnabled(u.smart_pricing_enabled !== false);
      setCookingSkill(u.cooking_skill || "beginner");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      zipcode: zipCode,
      use_live_location: useLiveLocation,
      preferred_stores: preferredStores,
      household_size: householdSize,
      household_members: householdMembers,
      notifications_enabled: notificationsEnabled,
      smart_pricing_enabled: smartPricingEnabled,
      cooking_skill: cookingSkill,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Toggle the live-location preference. When turning it ON, proactively detect
  // the ZIP now so it's ready and the permission prompt happens here (not later
  // mid-task). Falls back silently if the user denies permission.
  const handleToggleLiveLocation = async (checked) => {
    setUseLiveLocation(checked);
    if (checked) {
      setDetectingZip(true);
      const zip = await getLiveZip({ force: true });
      if (zip) setZipCode(zip);
      setDetectingZip(false);
    }
  };

  const handleDetectZipNow = async () => {
    setDetectingZip(true);
    const zip = await getLiveZip({ force: true });
    if (zip) setZipCode(zip);
    setDetectingZip(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleDeleteAccount = async () => {
    if (deleteStep === 0) { setDeleteStep(1); return; }
    setDeleteStep(2);
    // Mark account as deleted and log out
    await base44.auth.updateMe({ account_deleted: true, account_deleted_at: new Date().toISOString() });
    base44.auth.logout();
  };

  const handleCancelSubscription = async () => {
    await base44.auth.updateMe({ subscription_status: "cancelled" });
    const updated = await base44.auth.me();
    setUser(updated);
  };

  const toggleStore = (store) => {
    setPreferredStores((prev) =>
      prev.includes(store) ? prev.filter((s) => s !== store) : [...prev, store]
    );
  };

  const addHouseholdMember = () => {
    setHouseholdMembers([...householdMembers, { name: "", dietary_preferences: [] }]);
  };

  const updateMember = (index, field, value) => {
    const updated = [...householdMembers];
    updated[index] = { ...updated[index], [field]: value };
    setHouseholdMembers(updated);
  };

  const removeMember = (index) => {
    setHouseholdMembers(householdMembers.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = [
    {
      key: "profile",
      icon: User,
      title: "Profile",
      desc: user?.full_name || user?.email || "Your account",
      content: (
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/20 flex items-center justify-center text-2xl font-bold text-[#FF6B35]">
              {(user?.full_name || "U")[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#F5F5F0]">{user?.full_name || "User"}</h3>
              <p className="text-sm text-[#C4C4BA]/60">{user?.email}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#C4C4BA]/60 mb-1 block">Cooking Skill</label>
            <Select value={cookingSkill} onValueChange={setCookingSkill}>
              <SelectTrigger className="bg-[#243352] border-[#243352] text-[#F5F5F0] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A2744] border-[#243352]">
                <SelectItem value="beginner" className="text-[#F5F5F0]">Beginner</SelectItem>
                <SelectItem value="intermediate" className="text-[#F5F5F0]">Intermediate</SelectItem>
                <SelectItem value="advanced" className="text-[#F5F5F0]">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      key: "location",
      icon: MapPin,
      title: "Location & ZIP",
      desc: useLiveLocation ? "Using current location" : (zipCode || "Not set"),
      content: (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-[#C4C4BA]/60 mb-2 block">Home ZIP code</label>
            <Input
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="bg-[#243352] border-[#243352] text-[#F5F5F0] rounded-xl text-center text-xl tracking-widest"
              maxLength={5}
            />
          </div>

          <div className="flex items-start justify-between gap-3 bg-[#243352] rounded-xl p-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-[#F5F5F0]">Use my current location</p>
              <p className="text-xs text-[#C4C4BA]/60 mt-0.5">
                Prices follow you automatically — great when you're traveling. Falls back to your home ZIP if location is unavailable.
              </p>
            </div>
            <Switch checked={useLiveLocation} onCheckedChange={handleToggleLiveLocation} />
          </div>

          <button
            type="button"
            onClick={handleDetectZipNow}
            disabled={detectingZip}
            className="w-full flex items-center justify-center gap-2 bg-[#243352] hover:bg-[#2d4060] disabled:opacity-50 text-[#C4C4BA] rounded-xl py-2.5 text-sm transition"
          >
            <MapPin className="w-4 h-4" />
            {detectingZip ? "Detecting…" : "Detect my ZIP now"}
          </button>
        </div>
      ),
    },
    {
      key: "stores",
      icon: Store,
      title: "Preferred Stores",
      desc: `${preferredStores.length} selected`,
      content: (
        <div className="p-4 grid grid-cols-2 gap-2">
          {allStores.map((store) => (
            <button
              key={store}
              onClick={() => toggleStore(store)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                preferredStores.includes(store)
                  ? "bg-[#FF6B35] text-white"
                  : "bg-[#243352] text-[#C4C4BA] hover:bg-[#2d4060]"
              }`}
            >
              {store}
            </button>
          ))}
        </div>
      ),
    },
    {
      key: "household",
      icon: Users,
      title: "Household",
      desc: `${householdSize} ${householdSize === 1 ? "person" : "people"}`,
      content: (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-[#C4C4BA]/60 mb-2 block">Household Size</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setHouseholdSize(Math.max(1, householdSize - 1))}
                className="w-10 h-10 rounded-xl bg-[#243352] text-[#F5F5F0] text-lg font-bold"
              >−</button>
              <span className="text-2xl font-bold text-[#F5F5F0] w-10 text-center">{householdSize}</span>
              <button
                onClick={() => setHouseholdSize(householdSize + 1)}
                className="w-10 h-10 rounded-xl bg-[#243352] text-[#F5F5F0] text-lg font-bold"
              >+</button>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#C4C4BA]/60">Members</label>
              <button onClick={addHouseholdMember} className="text-xs text-[#FF6B35]">+ Add</button>
            </div>
            {householdMembers.map((member, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <Input
                  placeholder="Name"
                  value={member.name}
                  onChange={(e) => updateMember(i, "name", e.target.value)}
                  className="bg-[#243352] border-[#243352] text-[#F5F5F0] rounded-xl flex-1"
                />
                <button
                  onClick={() => removeMember(i)}
                  className="text-red-400 text-xs px-2"
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "subscription",
      icon: CreditCard,
      title: "Subscription",
      desc: user?.subscription_status === "active" ? "Active — $19.95/mo" : "Free",
      content: (
        <div className="p-4">
          {user?.subscription_status === "active" ? (
            <div>
              <div className="bg-[#34D399]/10 rounded-xl p-4 mb-3">
                <p className="text-sm font-semibold text-[#34D399]">Pantry Pro — Active</p>
                <p className="text-xs text-[#C4C4BA]/60 mt-1">$19.95/month</p>
              </div>
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl"
              >
                Cancel Subscription
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-[#C4C4BA] mb-3">Upgrade to Pantry Pro for $19.95/mo</p>
              <Button className="bg-[#FF6B35] hover:bg-[#FF8555] rounded-xl">
                Subscribe Now
              </Button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "notifications",
      icon: Bell,
      title: "Notifications",
      desc: notificationsEnabled ? "Enabled" : "Disabled",
      content: (
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm text-[#F5F5F0]">Push Notifications</span>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>
      ),
    },
    {
      key: "pricing",
      icon: Sparkles,
      title: "Smart Pricing",
      desc: smartPricingEnabled ? "Enabled" : "Disabled",
      content: (
        <div className="p-4 flex items-center justify-between">
          <div>
            <span className="text-sm text-[#F5F5F0]">AI Price Comparison</span>
            <p className="text-xs text-[#C4C4BA]/60 mt-0.5">Find cheapest ingredients across stores</p>
          </div>
          <Switch
            checked={smartPricingEnabled}
            onCheckedChange={setSmartPricingEnabled}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#15233A]">
      <div className="pt-6 px-5 pb-4">
        <h1 className="text-2xl font-bold text-[#F5F5F0] mb-1">Settings</h1>
        <p className="text-sm text-[#C4C4BA]/60">Manage your Bread experience</p>
      </div>

      <div className="px-4 space-y-2 pb-6">
        {sections.map((section) => {
          const Icon = section.icon;
          const isOpen = activeSection === section.key;

          return (
            <div key={section.key} className="bg-[#1A2744] rounded-2xl overflow-hidden">
              <button
                onClick={() => setActiveSection(isOpen ? null : section.key)}
                className="w-full flex items-center gap-4 p-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#243352] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#FF6B35]" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-medium text-[#F5F5F0]">{section.title}</h3>
                  <p className="text-xs text-[#C4C4BA]/50">{section.desc}</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-[#C4C4BA]/30 transition-transform ${isOpen ? "rotate-90" : ""}`} />
              </button>
              {isOpen && <div className="border-t border-white/5">{section.content}</div>}
            </div>
          );
        })}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12 mt-4"
        >
          {saved ? (
            <><Check className="w-4 h-4 mr-2" />Saved!</>
          ) : saving ? (
            "Saving..."
          ) : (
            <><Save className="w-4 h-4 mr-2" />Save Changes</>
          )}
        </Button>

        {/* Business Pages */}
        <div className="space-y-2 mt-4">
          <Button
            onClick={() => navigate(createPageUrl("AboutUs"))}
            className="w-full bg-[#1A2744] hover:bg-[#243352] text-[#F5F5F0] border border-[#243352] rounded-xl h-12 justify-start"
          >
            <Info className="w-4 h-4 mr-2" />
            About Us
          </Button>
          <Button
            onClick={() => navigate(createPageUrl("MonetizationInfo"))}
            className="w-full bg-[#1A2744] hover:bg-[#243352] text-[#F5F5F0] border border-[#243352] rounded-xl h-12 justify-start"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Creator Monetization
          </Button>
          <Button
            onClick={() => navigate(createPageUrl("AdvertiserPortal"))}
            className="w-full bg-[#1A2744] hover:bg-[#243352] text-[#F5F5F0] border border-[#243352] rounded-xl h-12 justify-start"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Advertise With Bread
          </Button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 text-red-400 text-sm font-medium mt-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        {/* Account Deletion */}
        <div className="bg-[#1A2744] rounded-2xl overflow-hidden mt-2">
          <button
            onClick={() => setDeleteStep(deleteStep === 0 ? 1 : 0)}
            className="w-full flex items-center gap-4 p-4"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-medium text-red-400">Delete Account</h3>
              <p className="text-xs text-[#C4C4BA]/50">Permanently remove your account and data</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-red-400/30 transition-transform ${deleteStep > 0 ? "rotate-90" : ""}`} />
          </button>

          {deleteStep >= 1 && (
            <div className="border-t border-red-500/10 p-4 space-y-3">
              <div className="flex items-start gap-3 bg-red-500/10 rounded-xl p-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-relaxed">
                  This will permanently delete your account, recipes, posts, and all associated data. <strong>This action cannot be undone.</strong>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteStep(0)}
                  className="flex-1 bg-[#243352] text-[#C4C4BA] rounded-xl py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteStep === 2}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {deleteStep === 2 ? "Deleting..." : "Yes, Delete My Account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}