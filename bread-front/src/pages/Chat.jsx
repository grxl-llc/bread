import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import moment from "moment";

export default function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const otherUserId = urlParams.get("userId");
  const otherUserName = urlParams.get("name") || "User";

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!otherUserId) return;
    base44.entities.User.filter({ id: otherUserId }).then((users) => {
      if (users.length > 0) setOtherUser(users[0]);
    });
  }, [otherUserId]);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat", currentUser?.id, otherUserId],
    queryFn: async () => {
      if (!currentUser || !otherUserId) return [];
      const sent = await base44.entities.Message.filter({ sender_id: currentUser.id, receiver_id: otherUserId });
      const received = await base44.entities.Message.filter({ sender_id: otherUserId, receiver_id: currentUser.id });
      return [...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    },
    enabled: !!currentUser && !!otherUserId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark received messages as read
  useEffect(() => {
    if (!currentUser || !messages.length) return;
    messages
      .filter((m) => m.receiver_id === currentUser.id && !m.read)
      .forEach((m) => base44.entities.Message.update(m.id, { read: true }));
  }, [messages, currentUser]);

  const handleSend = async () => {
    if (!text.trim() || !currentUser || !otherUserId) return;
    setSending(true);
    await base44.entities.Message.create({
      sender_id: currentUser.id,
      receiver_id: otherUserId,
      sender_name: currentUser.full_name,
      text: text.trim(),
      read: false,
    });
    setText("");
    queryClient.invalidateQueries({ queryKey: ["chat", currentUser.id, otherUserId] });
    setSending(false);
  };

  const displayName = otherUser?.full_name || otherUserName;

  return (
    <div className="min-h-screen bg-[#15233A] flex flex-col">
      {/* Header */}
      <div className="bg-[#1A2744] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-[#C4C4BA] hover:text-[#F5F5F0]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-[#FF6B35]/20 flex items-center justify-center text-sm font-bold text-[#FF6B35]">
          {displayName[0]?.toUpperCase() || "U"}
        </div>
        <span className="text-base font-semibold text-[#F5F5F0]">{displayName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-[#C4C4BA]/40 text-sm py-10">Say hello! Start the conversation.</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? "bg-[#FF6B35] text-white rounded-br-sm"
                    : "bg-[#1A2744] text-[#F5F5F0] rounded-bl-sm"
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "text-[#C4C4BA]/50"}`}>
                  {moment(msg.created_date).format("h:mm A")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-[#1A2744] border-t border-[#243352] px-4 py-3 flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-[#15233A] border-[#243352] text-[#F5F5F0] rounded-xl"
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl w-10 h-10 p-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}