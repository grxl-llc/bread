import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Image, Video, Tag, CheckCircle, XCircle, Plus, Trash2, Shield, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import AdminUsers from "../components/admin/AdminUsers";
import AdminPartners from "../components/admin/AdminPartners";
import AdminPendingAds from "../components/admin/AdminPendingAds";
import AdminApprovedAds from "../components/admin/AdminApprovedAds";
import AdminBrands from "../components/admin/AdminBrands";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setLoading(false);
      if (u?.role !== "admin") navigate("/");
    }).catch(() => {
      setLoading(false);
      navigate("/");
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15233A] pb-10">
      <div className="pt-6 px-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <h1 className="text-2xl font-bold text-[#F5F5F0]">Admin</h1>
          </div>
          <button
            onClick={() => navigate(createPageUrl("UserProfile"))}
            className="flex items-center gap-1.5 bg-[#1A2744] border border-white/10 text-[#C4C4BA] text-xs px-3 py-2 rounded-xl hover:border-[#FF6B35]/40 hover:text-[#FF6B35] transition"
          >
            <User className="w-3.5 h-3.5" />
            My Profile
          </button>
        </div>
        <p className="text-sm text-[#C4C4BA]/60 ml-11">Manage users, ads, brands & partners</p>
      </div>

      <Tabs defaultValue="users" className="px-4 pt-4">
        <TabsList className="bg-[#1A2744] border border-[#243352] rounded-xl p-1 mb-5 w-full grid grid-cols-5">
          {[
            { value: "users", icon: Users, label: "Users" },
            { value: "partners", icon: Star, label: "Partners" },
            { value: "pending-ads", icon: CheckCircle, label: "Pending" },
            { value: "approved-ads", icon: Image, label: "Ads" },
            { value: "brands", icon: Tag, label: "Brands" },
          ].map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white rounded-lg text-[10px] flex flex-col items-center gap-0.5 py-2"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="users"><AdminUsers /></TabsContent>
        <TabsContent value="partners"><AdminPartners /></TabsContent>
        <TabsContent value="pending-ads"><AdminPendingAds /></TabsContent>
        <TabsContent value="approved-ads"><AdminApprovedAds /></TabsContent>
        <TabsContent value="brands"><AdminBrands /></TabsContent>
      </Tabs>
    </div>
  );
}