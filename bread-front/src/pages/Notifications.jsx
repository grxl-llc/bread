import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Mail, Award, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const notificationIcons = {
  follower: Heart,
  comment: MessageCircle,
  dm: Mail,
  recipe_save: Heart,
  badge_unlock: Award,
  system: Info,
};

const notificationColors = {
  follower: "text-red-400",
  comment: "text-blue-400",
  dm: "text-purple-400",
  recipe_save: "text-pink-400",
  badge_unlock: "text-yellow-400",
  system: "text-[#C4C4BA]",
};

export default function NotificationsPage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, "-created_date", 50),
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = safeNotifications.filter((n) => !n.read);
      await Promise.all(unreadNotifications.map((n) => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#15233A]">
      <div className="pt-6 px-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-white/5 transition"
            >
              <ArrowLeft className="w-5 h-5 text-[#C4C4BA]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#F5F5F0]">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-[#C4C4BA]/60">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              size="sm"
              variant="ghost"
              className="text-[#FF6B35]"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#1A2744] rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : safeNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#C4C4BA]/40">
            <Info className="w-12 h-12 mb-3" />
            <p className="text-base font-medium">No notifications yet</p>
            <p className="text-sm mt-1">You'll see updates here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {safeNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Info;
              const iconColor = notificationColors[notification.type] || "text-[#C4C4BA]";
              
              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full bg-[#1A2744] rounded-2xl p-4 text-left transition hover:bg-[#243352] ${
                    !notification.read ? "ring-2 ring-[#FF6B35]/30" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-[#15233A] flex items-center justify-center ${iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-[#F5F5F0]">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-[#C4C4BA] line-clamp-2">{notification.message}</p>
                      {notification.actor_name && (
                        <p className="text-xs text-[#C4C4BA]/60 mt-1">by {notification.actor_name}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}