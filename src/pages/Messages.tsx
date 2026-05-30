import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Send,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  Users,
  Lightbulb,
  MoreHorizontal,
  Pin,
  Archive,
  Paperclip,
  CheckCheck,
  Check,
  Plus,
} from "lucide-react";

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

const Messages = () => {
  const [conversations, setConversations] = useState<DBConversation[]>([]);
  const [messages, setMessages] = useState<Record<string, DBMessage[]>>({});
  const [selectedConversation, setSelectedConversation] =
    useState<DBConversation | null>(null);

  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [newMessage, setNewMessage] = useState("");
  const [showBulkMessage, setShowBulkMessage] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState("");
  const [showAITemplates, setShowAITemplates] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // New conversation dialog
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [firstMessage, setFirstMessage] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const uid = userData.user.id;
      setUserId(uid);

      // Get conversations where user is involved
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .or(`student_id.eq.${uid},counselor_id.eq.${uid},parent_id.eq.${uid}`)
        .order("created_at", { ascending: false });

      if (!data) return;

      setConversations(data);

      // Fetch profiles
      const userIds = [
        ...new Set(
          data.flatMap((c) => [c.student_id, c.counselor_id, c.parent_id]).filter(Boolean)
        ),
      ];

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds as string[]);

      const profileMap: Record<string, any> = {};
      prof?.forEach((p) => (profileMap[p.user_id] = p));
      setProfiles(profileMap);

      // Fetch messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .in(
          "conversation_id",
          data.map((c) => c.id)
        )
        .order("created_at");

      const grouped: Record<string, DBMessage[]> = {};
      msgs?.forEach((m) => {
        if (!grouped[m.conversation_id]) grouped[m.conversation_id] = [];
        grouped[m.conversation_id].push(m);
      });

      setMessages(grouped);
    };

    load();
  }, []);

  // ── Real-time subscription ─────────────────────────────────────
  useEffect(() => {
    if (conversations.length === 0) return;

    const convIds = conversations.map((c) => c.id);

    const channel = supabase
      .channel("counselor-messages-rt")
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

  // ── Auto-scroll ────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversation]);

  // ── Select conversation & mark as read ─────────────────────────
  const selectConversation = async (conv: DBConversation) => {
    setSelectedConversation(conv);

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

  // ── New Conversation ───────────────────────────────────────────
  const openNewConversationDialog = async () => {
    if (!userId) return;

    // Load assigned students
    const { data: assignments } = await supabase
      .from("student_counselor_assignments")
      .select("student_id")
      .eq("counselor_id", userId);

    if (!assignments || assignments.length === 0) {
      setAssignedStudents([]);
      setShowNewConversation(true);
      return;
    }

    const studentIds = assignments.map((a) => a.student_id);
    const { data: profs } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", studentIds);

    setAssignedStudents(profs || []);
    setSelectedStudentId(profs?.[0]?.user_id ?? "");
    setFirstMessage("");
    setShowNewConversation(true);
  };

  const startConversation = async () => {
    if (!selectedStudentId || !firstMessage.trim() || !userId) return;
    setCreating(true);

    // Check if conversation already exists
    const existing = conversations.find(
      (c) => c.student_id === selectedStudentId && c.counselor_id === userId
    );

    if (existing) {
      // Just send the message in the existing conversation
      const { data: msg } = await supabase
        .from("messages")
        .insert({ conversation_id: existing.id, sender_id: userId, content: firstMessage.trim() })
        .select()
        .single();
      setSelectedConversation(existing);
      setShowNewConversation(false);
      setCreating(false);
      return;
    }

    // Create new conversation
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ student_id: selectedStudentId, counselor_id: userId, status: "active" })
      .select()
      .single();

    if (!conv) { setCreating(false); return; }

    // Send first message
    const { data: msg } = await supabase
      .from("messages")
      .insert({ conversation_id: conv.id, sender_id: userId, content: firstMessage.trim() })
      .select()
      .single();

    // Load the student profile if not already in map
    if (!profiles[selectedStudentId]) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", selectedStudentId)
        .single();
      if (prof) setProfiles((prev) => ({ ...prev, [prof.user_id]: prof }));
    }

    setConversations((prev) => [conv, ...prev]);
    setMessages((prev) => ({ ...prev, [conv.id]: msg ? [msg] : [] }));
    setSelectedConversation(conv);
    setShowNewConversation(false);
    setFirstMessage("");
    setCreating(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: userData.user.id,
        content: newMessage,
      })
      .select()
      .single();

    if (!data) return;
    setNewMessage("");
  };

  // ─────────────────────────────────────────
  // Derived Stats
  // ─────────────────────────────────────────
  const totalUnread = useMemo(() => {
    return Object.values(messages)
      .flat()
      .filter((m) => !m.read).length;
  }, [messages]);

  const urgentCount = conversations.filter(
    (c) => c.status === "urgent"
  ).length;

  const filteredConversations = conversations.filter((conv) => {
    const studentProfile = profiles[conv.student_id];
    const studentName = studentProfile?.full_name || "";

    const matchesSearch = studentName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const convMessages = messages[conv.id] || [];
    const hasUnread = convMessages.some((m) => !m.read);

    switch (filter) {
      case "urgent":
        return matchesSearch && conv.status === "urgent";
      case "unread":
        return matchesSearch && hasUnread;
      case "students":
        return matchesSearch && !conv.parent_id;
      case "parents":
        return matchesSearch && !!conv.parent_id;
      default:
        return matchesSearch;
    }
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "counselor": return "bg-primary/10 text-primary border-primary/20";
      case "student": return "bg-secondary/10 text-secondary-foreground border-secondary/20";
      case "parent": return "bg-accent/10 text-accent-foreground border-accent/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">Communicate with students and parents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowBulkMessage(true)}>
            <Users className="h-4 w-4 mr-2" />
            Bulk Message
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold text-foreground">{conversations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
                <p className="text-2xl font-bold text-foreground">{totalUnread}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-foreground">{urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </CardTitle>
                <Button size="sm" onClick={openNewConversationDialog} title="New conversation">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter conversations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="parents">Parents Only</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filteredConversations.map((conv) => {
                const student = profiles[conv.student_id];
                const parent = conv.parent_id ? profiles[conv.parent_id] : null;
                const convMessages = messages[conv.id] || [];
                const lastMsg = convMessages[convMessages.length - 1];
                const unreadCount = convMessages.filter((m) => !m.read).length;
                const initials = (student?.full_name || "?")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("");

                return (
                  <div
                    key={conv.id}
                    className={`p-4 hover:bg-muted/50 cursor-pointer border-l-4 transition-colors ${
                      selectedConversation?.id === conv.id
                        ? "bg-muted border-l-primary"
                        : conv.status === "urgent"
                        ? "border-l-destructive"
                        : "border-l-transparent"
                    }`}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student?.avatar_url} alt={student?.full_name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground truncate">
                              {student?.full_name || "Student"}
                            </p>
                            {parent && (
                              <p className="text-xs text-muted-foreground">
                                & {parent.full_name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                            {conv.status === "urgent" && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </div>

                        {lastMsg && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {lastMsg.content}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          {lastMsg && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(lastMsg.created_at).toLocaleString()}
                            </p>
                          )}
                          <div className="flex gap-1">
                            {conv.tags?.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Messages Panel */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={profiles[selectedConversation.student_id]?.avatar_url}
                        alt={profiles[selectedConversation.student_id]?.full_name}
                      />
                      <AvatarFallback>
                        {(profiles[selectedConversation.student_id]?.full_name || "?")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {profiles[selectedConversation.student_id]?.full_name || "Conversation"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {[
                          profiles[selectedConversation.student_id]?.full_name,
                          selectedConversation.parent_id &&
                            profiles[selectedConversation.parent_id]?.full_name,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Pin className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col h-[550px]">
                {/* Messages Area */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {(messages[selectedConversation.id] || []).map((msg) => {
                    const isCounselor = msg.sender_id === selectedConversation.counselor_id;
                    const senderProfile = profiles[msg.sender_id];
                    const senderName = senderProfile?.full_name || "Unknown";
                    const role =
                      msg.sender_id === selectedConversation.counselor_id
                        ? "counselor"
                        : msg.sender_id === selectedConversation.student_id
                        ? "student"
                        : "parent";

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCounselor ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] ${isCounselor ? "order-2" : "order-1"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {!isCounselor && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {senderName.split(" ").map((n: string) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <Badge variant="outline" className={`text-xs ${getRoleColor(role)}`}>
                              {role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-lg ${
                              isCounselor
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                          </div>

                          {isCounselor && (
                            <div className="flex items-center gap-1 mt-1 justify-end">
                              {msg.read ? (
                                <CheckCheck className="h-3 w-3 text-primary" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {msg.read ? "Read" : "Delivered"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div ref={bottomRef} />
                {/* Message Composer */}
                <div className="border-t border-border p-4 space-y-3">
                  {showAITemplates && (
                    <Card className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            Message Templates
                          </h4>
                          <Button variant="ghost" size="sm" onClick={() => setShowAITemplates(false)}>
                            ×
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {["Deadline Reminder", "Essay Feedback", "Recommendation Status", "Meeting Reminder"].map((title) => (
                            <Button key={title} variant="outline" size="sm" className="text-left h-auto p-2">
                              <p className="font-medium text-xs">{title}</p>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[60px] resize-none pr-12"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setShowAITemplates(!showAITemplates)}
                      >
                        <Lightbulb className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button onClick={sendMessage} disabled={!newMessage.trim()} size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">Choose a conversation from the left to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              New Conversation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {assignedStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No assigned students found. Assign students first from the Students page.
              </p>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Student</label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedStudents.map((s) => (
                        <SelectItem key={s.user_id} value={s.user_id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={s.avatar_url} />
                              <AvatarFallback className="text-[10px]">
                                {(s.full_name || "S").split(" ").map((n: string) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            {s.full_name || s.email || "Student"}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    placeholder="Type your first message..."
                    value={firstMessage}
                    onChange={(e) => setFirstMessage(e.target.value)}
                    className="min-h-[100px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        startConversation();
                      }
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!selectedStudentId || !firstMessage.trim() || creating}
                    onClick={startConversation}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {creating ? "Starting..." : "Start Conversation"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewConversation(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Message Dialog */}
      <Dialog open={showBulkMessage} onOpenChange={setShowBulkMessage}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Send Bulk Message
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Recipients</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded p-2">
                {conversations.map((conv) => {
                  const student = profiles[conv.student_id];
                  const parent = conv.parent_id ? profiles[conv.parent_id] : null;
                  return (
                    <div key={conv.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedStudents.includes(conv.student_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents([...selectedStudents, conv.student_id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter((id) => id !== conv.student_id));
                          }
                        }}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={student?.avatar_url} alt={student?.full_name} />
                        <AvatarFallback className="text-xs">
                          {(student?.full_name || "?").split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{student?.full_name || "Student"}</span>
                      {parent && (
                        <span className="text-xs text-muted-foreground">& {parent.full_name}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                placeholder="Type your bulk message here..."
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={selectedStudents.length === 0 || !bulkMessage.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Send to {selectedStudents.length} recipient(s)
              </Button>
              <Button variant="outline" onClick={() => setShowBulkMessage(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
