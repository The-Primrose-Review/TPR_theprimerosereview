import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Search, Send, MessageSquare, AlertCircle, Paperclip, CheckCheck, Check, Plus } from "lucide-react";

type DBConversation = {
  id: string;
  student_id: string;
  counselor_id: string;
  parent_id: string | null;
  status: "active" | "urgent" | "archived";
  tags: string[] | null;
  created_at: string;
};

type DBMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

const ParentMessages = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<DBConversation[]>([]);
  const [messages, setMessages] = useState<Record<string, DBMessage[]>>({});
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<DBConversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewConvDialog, setShowNewConvDialog] = useState(false);
  const [linkedStudentId, setLinkedStudentId] = useState<string | null>(null);
  const [linkedCounselorId, setLinkedCounselorId] = useState<string | null>(null);
  const [linkedCounselorName, setLinkedCounselorName] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load data ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const uid = userData.user.id;
      setUserId(uid);

      // Look up linked student and their counselor for "New Message" flow
      const { data: assignment } = await supabase
        .from("parent_student_assignments")
        .select("student_id")
        .eq("parent_id", uid)
        .maybeSingle();

      if (assignment?.student_id) {
        setLinkedStudentId(assignment.student_id);
        const { data: counselorLink } = await supabase
          .from("student_counselor_assignments")
          .select("counselor_id")
          .eq("student_id", assignment.student_id)
          .maybeSingle();

        if (counselorLink?.counselor_id) {
          setLinkedCounselorId(counselorLink.counselor_id);
          const { data: counselorProf } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", counselorLink.counselor_id)
            .single();
          setLinkedCounselorName(counselorProf?.full_name ?? null);
        }
      }

      const { data: convData } = await supabase
        .from("conversations")
        .select("*")
        .eq("parent_id", uid)
        .order("created_at", { ascending: false });

      if (!convData || convData.length === 0) {
        setLoading(false);
        return;
      }

      setConversations(convData);
      setSelected(convData[0]);

      // Fetch counselor + student profiles for all participants
      const participantIds = [
        ...new Set([
          ...convData.map((c) => c.counselor_id),
          ...convData.map((c) => c.student_id),
        ].filter(Boolean)),
      ];

      if (participantIds.length > 0) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", participantIds);
        const map: Record<string, any> = {};
        prof?.forEach((p) => (map[p.user_id] = p));
        setProfiles(map);
      }

      // Fetch messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", convData.map((c) => c.id))
        .order("created_at");

      const grouped: Record<string, DBMessage[]> = {};
      msgs?.forEach((m) => {
        if (!grouped[m.conversation_id]) grouped[m.conversation_id] = [];
        grouped[m.conversation_id].push(m);
      });
      setMessages(grouped);
      setLoading(false);
    };

    load();
  }, []);

  // ── Real-time subscription ─────────────────────────────────────
  useEffect(() => {
    if (conversations.length === 0) return;

    const convIds = conversations.map((c) => c.id);

    const channel = supabase
      .channel("parent-messages-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as DBMessage;
          if (!convIds.includes(msg.conversation_id)) return;
          setMessages((prev) => ({
            ...prev,
            [msg.conversation_id]: [...(prev[msg.conversation_id] || []), msg],
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as DBMessage;
          if (!convIds.includes(msg.conversation_id)) return;
          setMessages((prev) => ({
            ...prev,
            [msg.conversation_id]: (prev[msg.conversation_id] || []).map((m) =>
              m.id === msg.id ? msg : m
            ),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversations]);

  // ── Auto-scroll to bottom ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selected]);

  // ── Select conversation & mark as read ────────────────────────
  const selectConversation = async (conv: DBConversation) => {
    setSelected(conv);

    const unread = (messages[conv.id] || []).filter(
      (m) => !m.read && m.sender_id !== userId
    );
    if (unread.length === 0) return;

    await supabase
      .from("messages")
      .update({ read: true })
      .in("id", unread.map((m) => m.id));

    setMessages((prev) => ({
      ...prev,
      [conv.id]: (prev[conv.id] || []).map((m) =>
        !m.read && m.sender_id !== userId ? { ...m, read: true } : m
      ),
    }));
  };

  // ── Send message ───────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() || !selected || !userId) return;

    const { data } = await supabase
      .from("messages")
      .insert({
        conversation_id: selected.id,
        sender_id: userId,
        content: newMessage.trim(),
      })
      .select()
      .single();

    if (!data) return;

    setMessages((prev) => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] || []), data],
    }));
    setNewMessage("");
  };

  // ── Create new conversation with counselor ─────────────────────
  const createConversation = async () => {
    if (!userId || !linkedStudentId || !linkedCounselorId) return;
    setCreating(true);

    // If a conversation already exists between this parent, student, and counselor, just select it
    const existing = conversations.find(
      (c) => c.student_id === linkedStudentId && c.counselor_id === linkedCounselorId
    );
    if (existing) {
      setSelected(existing);
      setShowNewConvDialog(false);
      setCreating(false);
      return;
    }

    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        student_id: linkedStudentId,
        counselor_id: linkedCounselorId,
        parent_id: userId,
        status: "active",
      })
      .select()
      .single();

    if (newConv) {
      setConversations((prev) => [newConv, ...prev]);
      setSelected(newConv);
      setMessages((prev) => ({ ...prev, [newConv.id]: [] }));
    }

    setShowNewConvDialog(false);
    setCreating(false);
  };

  // ── Derived ────────────────────────────────────────────────────
  const totalUnread = Object.values(messages)
    .flat()
    .filter((m) => !m.read && m.sender_id !== userId).length;

  const sortedConversations = [...conversations].sort((a, b) => {
    const aLast = messages[a.id]?.at(-1)?.created_at ?? a.created_at;
    const bLast = messages[b.id]?.at(-1)?.created_at ?? b.created_at;
    return new Date(bLast).getTime() - new Date(aLast).getTime();
  });

  const filteredConversations = sortedConversations.filter((c) => {
    const counselorName = profiles[c.counselor_id]?.full_name ?? "";
    const studentName = profiles[c.student_id]?.full_name ?? "";
    const lastMsg = messages[c.id]?.at(-1)?.content ?? "";
    const q = searchTerm.toLowerCase();
    return (
      counselorName.toLowerCase().includes(q) ||
      studentName.toLowerCase().includes(q) ||
      lastMsg.toLowerCase().includes(q)
    );
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatFullTime = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  // ── Thread header label ────────────────────────────────────────
  const getThreadLabel = (conv: DBConversation) => {
    const counselorName = profiles[conv.counselor_id]?.full_name || "Counselor";
    const studentName = profiles[conv.student_id]?.full_name;
    return studentName
      ? `${counselorName} · re: ${studentName}`
      : counselorName;
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* New Conversation Dialog */}
      <Dialog open={showNewConvDialog} onOpenChange={setShowNewConvDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message your child's counselor</DialogTitle>
            <DialogDescription>
              {linkedCounselorName
                ? `This will start a conversation with ${linkedCounselorName}, your child's assigned counselor.`
                : "No counselor is assigned to your child yet. Please contact the school to get a counselor assigned."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewConvDialog(false)}>Cancel</Button>
            {linkedCounselorId && (
              <Button onClick={createConversation} disabled={creating}>
                {creating ? "Starting…" : "Start Conversation"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">Stay in touch with your child's counselor</p>
        </div>
        <div className="flex items-center gap-3">
          {totalUnread > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-lg px-4 py-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {totalUnread} unread message{totalUnread > 1 ? "s" : ""}
              </span>
            </div>
          )}
          {linkedCounselorId && (
            <Button onClick={() => setShowNewConvDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Message Counselor
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-[680px] rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Conversation List */}
        <div className="lg:col-span-1 flex flex-col border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  {linkedCounselorId
                    ? "Start a conversation with your child's counselor."
                    : "Your child's counselor will start a conversation with you here."}
                </p>
                {linkedCounselorId && (
                  <Button size="sm" variant="outline" onClick={() => setShowNewConvDialog(true)} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Message Counselor
                  </Button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const counselor = profiles[conv.counselor_id];
                const student = profiles[conv.student_id];
                const convMessages = messages[conv.id] || [];
                const lastMsg = convMessages.at(-1);
                const unreadCount = convMessages.filter(
                  (m) => !m.read && m.sender_id !== userId
                ).length;
                const initials = (counselor?.full_name || "C")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("");

                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`p-4 cursor-pointer border-l-4 transition-colors hover:bg-muted/50 ${
                      selected?.id === conv.id
                        ? "bg-muted border-l-primary"
                        : conv.status === "urgent"
                        ? "border-l-destructive"
                        : "border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={counselor?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground text-sm truncate">
                            {counselor?.full_name || "Counselor"}
                          </p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {lastMsg ? formatTime(lastMsg.created_at) : ""}
                          </span>
                        </div>
                        {student && (
                          <p className="text-xs text-primary/70 truncate">re: {student.full_name}</p>
                        )}
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <p className="text-xs text-muted-foreground truncate flex-1">
                            {lastMsg?.content || "No messages yet"}
                          </p>
                          {unreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 min-w-5 flex items-center justify-center p-0 px-1 text-xs shrink-0"
                            >
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conv.status === "urgent" && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 mt-1">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2 flex flex-col bg-card">
          {selected ? (
            <>
              {/* Thread Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profiles[selected.counselor_id]?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold">
                    {(profiles[selected.counselor_id]?.full_name || "C")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {getThreadLabel(selected)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selected.status === "urgent" ? "🔴 Urgent" : "● Active"}
                  </p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/20">
                {(messages[selected.id] || []).map((msg) => {
                  const isMe = msg.sender_id === userId;
                  const senderProfile = profiles[msg.sender_id];
                  const senderName = senderProfile?.full_name || "Counselor";
                  const senderInitials = senderName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("");

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[72%] flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        {!isMe && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={senderProfile?.avatar_url} />
                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                {senderInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{senderName}</span>
                          </div>
                        )}
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-card text-foreground rounded-tl-sm border border-border"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {formatFullTime(msg.created_at)}
                          </span>
                          {isMe && (
                            msg.read
                              ? <CheckCheck className="h-3 w-3 text-primary" />
                              : <Check className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-border p-4 bg-card">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[52px] max-h-[120px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleSend} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to send ·{" "}
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Shift+Enter</kbd> for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No conversation selected</h3>
                <p className="text-muted-foreground text-sm">Choose a conversation from the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentMessages;
