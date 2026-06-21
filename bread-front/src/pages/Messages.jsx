import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle } from "lucide-react";
import moment from "moment";

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["allMessages", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const sent = await base44.entities.Message.filter({ sender_id: currentUser.id });
      const received = await base44.entities.Message.filter({ receiver_id: currentUser.id });
      return [...sent, ...received].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!currentUser,
  });

  // Group messages by conversation
  const conversations = React.useMemo(() => {
    if (!currentUser || !messages.length) return [];

    const convMap = new Map();

    messages.forEach((msg) => {
      const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
      
      if (!convMap.has(otherUserId)) {
        convMap.set(otherUserId, {
          userId: otherUserId,
          userName: msg.sender_id === currentUser.id ? "User" : msg.sender_name,
          userAvatar: msg.sender_id === currentUser.id ? "" : msg.sender_avatar,
          lastMessage: msg.text,
          lastMessageTime: msg.created_date,
          unreadCount: 0,
        });
      }

      const conv = convMap.get(otherUserId);
      if (new Date(msg.created_date) > new Date(conv.lastMessageTime)) {
        conv.lastMessage = msg.text;
        conv.lastMessageTime = msg.created_date;
      }

      if (msg.receiver_id === currentUser.id && !msg.read) {
        conv.unreadCount++;
      }
    });

    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
  }, [messages, currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#15233A] flex items-center justify-center">
        <p className="text-[#C4C4BA]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15233A]">
      {/* Header */}
      <div className="bg-[#1A2744] px-5 py-4 sticky top-0 z-10 backdrop-blur-xl bg-opacity-90">
        <h1 className="text-xl font-bold text-[#F5F5F0]">Messages</h1>
      </div>

      {/* Conversations List */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#1A2744] rounded-2xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#C4C4BA]/40">
            <MessageCircle className="w-12 h-12 mb-3" />
            <p className="text-base font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start a conversation from a user's profile</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link
                key={conv.userId}
                to={createPageUrl("Chat") + `?userId=${conv.userId}`}
                className="block bg-[#1A2744] rounded-2xl p-4 hover:bg-[#243352] transition"
              >
                <div className="flex items-center gap-3">
                  {conv.userAvatar ? (
                    <img
                      src={conv.userAvatar}
                      alt={conv.userName}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#FF6B35]/20 flex items-center justify-center text-lg font-bold text-[#FF6B35] flex-shrink-0">
                      {(conv.userName || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm font-medium text-[#F5F5F0]">
                        {conv.userName || "User"}
                      </span>
                      <span className="text-xs text-[#C4C4BA]/40">
                        {moment(conv.lastMessageTime).fromNow()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#C4C4BA]/60 truncate">
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 bg-[#FF6B35] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}