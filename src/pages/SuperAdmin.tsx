import { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, LogOut, RefreshCw, Download,
  Users, Building2, GraduationCap, UserCircle, Shield,
  Trash2, ArrowLeftRight, MessageSquare, Send,
} from "lucide-react";
import { toast } from "sonner";
import primroseLogo from "@/assets/primrose-logo.png";

type PlatformUser = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  school_name: string | null;
  joined_at: string | null;
};

type MsgRecord = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

const ROLE_TABS = ["all", "student", "counselor", "principal", "parent", "admin"] as const;
type RoleTab = (typeof ROLE_TABS)[number];

const ROLE_META: Record<string, { label: string; color: string }> = {
  student:   { label: "Student",   color: "bg-blue-100 text-blue-700 border-blue-200" },
  counselor: { label: "Counselor", color: "bg-purple-100 text-purple-700 border-purple-200" },
  principal: { label: "Principal", color: "bg-green-100 text-green-700 border-green-200" },
  parent:    { label: "Parent",    color: "bg-orange-100 text-orange-700 border-orange-200" },
  admin:     { label: "Admin",     color: "bg-red-100 text-red-700 border-red-200" },
  "no role": { label: "No Role",   color: "bg-gray-100 text-gray-500 border-gray-200" },
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const SuperAdmin = () => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<RoleTab>("all");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  // ── Delete state ──────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<PlatformUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Reassign state ────────────────────────────────────────────
  const [reassignTarget, setReassignTarget] = useState<PlatformUser | null>(null);
  const [reassignCounselorId, setReassignCounselorId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  // ── Message state ─────────────────────────────────────────────
  const [msgTarget, setMsgTarget] = useState<PlatformUser | null>(null);
  const [msgHistory, setMsgHistory] = useState<MsgRecord[]>([]);
  const [msgConvId, setMsgConvId] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const msgBottomRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await (supabase as any).rpc("get_all_platform_users");
    setUsers((data ?? []) as PlatformUser[]);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    supabase.auth.getUser().then(({ data }) => setAdminUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    msgBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgHistory]);

  // ── Stats ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const schools = new Set(users.map(u => u.school_name).filter(Boolean)).size;
    const byRole = (role: string) => users.filter(u => u.role === role).length;
    return {
      schools,
      students:   byRole("student"),
      counselors: byRole("counselor"),
      principals: byRole("principal"),
      parents:    byRole("parent"),
      total:      users.length,
    };
  }, [users]);

  // ── School breakdown ─────────────────────────────────────────
  const schoolBreakdown = useMemo(() => {
    const map = new Map<string, { students: number; counselors: number; principals: number; parents: number }>();
    for (const u of users) {
      const key = u.school_name ?? "No School";
      if (!map.has(key)) map.set(key, { students: 0, counselors: 0, principals: 0, parents: 0 });
      const entry = map.get(key)!;
      if (u.role === "student")   entry.students++;
      if (u.role === "counselor") entry.counselors++;
      if (u.role === "principal") entry.principals++;
      if (u.role === "parent")    entry.parents++;
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [users]);

  // ── Filtered users ───────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchesRole = activeTab === "all" || u.role === activeTab;
      const matchesSearch =
        (u.full_name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.school_name ?? "").toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, search, activeTab]);

  const counselors = useMemo(() => users.filter(u => u.role === "counselor"), [users]);

  // ── CSV export ───────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["Full Name", "Email", "Role", "School", "Joined"];
    const rows = filtered.map(u => [
      u.full_name ?? "",
      u.email ?? "",
      u.role,
      u.school_name ?? "",
      fmt(u.joined_at),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `primrose-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  // ── Delete handler ───────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await (supabase as any).rpc("delete_platform_user", {
      p_user_id: deleteTarget.user_id,
    });
    setDeleting(false);
    if (error) {
      toast.error(error.message || "Failed to delete user");
      return;
    }
    setUsers(prev => prev.filter(u => u.user_id !== deleteTarget.user_id));
    toast.success(`${deleteTarget.full_name ?? deleteTarget.email} deleted`);
    setDeleteTarget(null);
  };

  // ── Reassign handler ─────────────────────────────────────────
  const openReassignDialog = (student: PlatformUser) => {
    setReassignTarget(student);
    setReassignCounselorId(counselors[0]?.user_id ?? "");
  };

  const handleReassignConfirm = async () => {
    if (!reassignTarget || !reassignCounselorId) return;
    setReassigning(true);
    const { error } = await (supabase as any).rpc("reassign_student", {
      p_student_id: reassignTarget.user_id,
      p_new_counselor_id: reassignCounselorId,
    });
    setReassigning(false);
    if (error) {
      toast.error(error.message || "Failed to reassign student");
      return;
    }
    const counselorName = counselors.find(c => c.user_id === reassignCounselorId)?.full_name ?? "new counselor";
    toast.success(`${reassignTarget.full_name ?? "Student"} reassigned to ${counselorName}`);
    setReassignTarget(null);
  };

  // ── Message handlers ─────────────────────────────────────────
  const openMessageDialog = async (student: PlatformUser) => {
    if (!adminUserId) return;
    setMsgTarget(student);
    setMsgHistory([]);
    setMsgConvId(null);
    setMsgText("");
    setMsgLoading(true);

    const { data: convId, error } = await (supabase as any).rpc(
      "admin_get_or_create_conversation",
      { p_admin_id: adminUserId, p_student_id: student.user_id }
    );
    if (error || !convId) {
      toast.error("Could not open conversation");
      setMsgLoading(false);
      return;
    }
    setMsgConvId(convId as string);

    const { data: msgs } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", convId)
      .order("created_at");
    setMsgHistory((msgs ?? []) as MsgRecord[]);
    setMsgLoading(false);
  };

  const handleSendMessage = async () => {
    if (!msgText.trim() || !msgConvId || !adminUserId) return;
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: msgConvId, sender_id: adminUserId, content: msgText.trim() })
      .select("id, sender_id, content, created_at")
      .single();
    setSending(false);
    if (error || !data) {
      toast.error("Failed to send message");
      return;
    }
    setMsgHistory(prev => [...prev, data as MsgRecord]);
    setMsgText("");
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <img src={primroseLogo} alt="Primrose" className="h-10 w-auto" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Super Admin</h1>
            <p className="text-xs text-gray-400">
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Schools",   value: stats.schools,    icon: Building2,     color: "text-gray-600",   bg: "bg-gray-100" },
            { label: "Total Users",     value: stats.total,      icon: Users,         color: "text-gray-700",   bg: "bg-gray-100" },
            { label: "Students",        value: stats.students,   icon: Users,         color: "text-blue-600",   bg: "bg-blue-50" },
            { label: "Counselors",      value: stats.counselors, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Principals",      value: stats.principals, icon: Building2,     color: "text-green-600",  bg: "bg-green-50" },
            { label: "Parents",         value: stats.parents,    icon: UserCircle,    color: "text-orange-600", bg: "bg-orange-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <Skeleton className="h-7 w-10" /> : value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Schools breakdown ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              Schools
            </h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : schoolBreakdown.length === 0 ? (
            <p className="p-6 text-sm text-gray-400">No schools found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">School Name</th>
                  <th className="px-6 py-3 text-center">Students</th>
                  <th className="px-6 py-3 text-center">Counselors</th>
                  <th className="px-6 py-3 text-center">Principals</th>
                  <th className="px-6 py-3 text-center">Parents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schoolBreakdown.map(([school, counts]) => (
                  <tr key={school} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{school}</td>
                    <td className="px-6 py-3 text-center text-blue-700 font-medium">{counts.students}</td>
                    <td className="px-6 py-3 text-center text-purple-700 font-medium">{counts.counselors}</td>
                    <td className="px-6 py-3 text-center text-green-700 font-medium">{counts.principals}</td>
                    <td className="px-6 py-3 text-center text-orange-700 font-medium">{counts.parents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── All users table ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              All Users
              <span className="text-sm font-normal text-gray-400">({filtered.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search name, email, school…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 w-64 h-8 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Role tabs */}
          <div className="px-6 py-2 border-b border-gray-100 flex gap-1 overflow-x-auto">
            {ROLE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab === "all" ? `All (${users.length})` : `${tab}s (${users.filter(u => u.role === tab).length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left">User</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">School</th>
                    <th className="px-6 py-3 text-left">Joined</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(u => {
                    const meta = ROLE_META[u.role] ?? ROLE_META["no role"];
                    const initials = (u.full_name ?? u.email ?? "?")
                      .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                    const isStudent = u.role === "student";
                    const isSelf = u.user_id === adminUserId;
                    return (
                      <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-xs bg-gray-100 text-gray-600 font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-gray-900 truncate max-w-[180px]">
                              {u.full_name ?? <span className="text-gray-400 italic">No name</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-blue-600 max-w-[220px] truncate">
                          {u.email ?? "—"}
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant="outline" className={`text-xs capitalize ${meta.color}`}>
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-gray-600 max-w-[200px] truncate">
                          {u.school_name ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                          {fmt(u.joined_at)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {isStudent && (
                              <>
                                <button
                                  onClick={() => openReassignDialog(u)}
                                  title="Reassign counselor"
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                >
                                  <ArrowLeftRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => openMessageDialog(u)}
                                  title="Send message"
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            {!isSelf && (
                              <button
                                onClick={() => setDeleteTarget(u)}
                                title="Delete user"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete User
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Permanently delete{" "}
            <strong>{deleteTarget?.full_name ?? deleteTarget?.email}</strong> and all their data?
            This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reassign Dialog ── */}
      <Dialog open={!!reassignTarget} onOpenChange={open => !open && setReassignTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-purple-600" />
              Reassign Student
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Reassigning <strong>{reassignTarget?.full_name ?? reassignTarget?.email}</strong> to a new counselor.
              Existing messages will move to the new counselor.
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">New Counselor</label>
              {counselors.length === 0 ? (
                <p className="text-sm text-gray-400">No counselors found on the platform.</p>
              ) : (
                <Select value={reassignCounselorId} onValueChange={setReassignCounselorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a counselor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {counselors.map(c => (
                      <SelectItem key={c.user_id} value={c.user_id}>
                        <div className="flex flex-col">
                          <span>{c.full_name ?? c.email ?? "Unnamed"}</span>
                          {c.school_name && (
                            <span className="text-xs text-gray-400">{c.school_name}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReassignTarget(null)} disabled={reassigning}>
              Cancel
            </Button>
            <Button
              onClick={handleReassignConfirm}
              disabled={reassigning || !reassignCounselorId || counselors.length === 0}
            >
              {reassigning ? "Reassigning…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Message Dialog ── */}
      <Dialog open={!!msgTarget} onOpenChange={open => { if (!open) { setMsgTarget(null); setMsgHistory([]); setMsgConvId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Message — {msgTarget?.full_name ?? msgTarget?.email}
            </DialogTitle>
          </DialogHeader>

          {/* Message history */}
          <div className="h-72 overflow-y-auto border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50">
            {msgLoading ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                Loading…
              </div>
            ) : msgHistory.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                No messages yet. Say hello!
              </div>
            ) : (
              msgHistory.map(msg => {
                const isAdmin = msg.sender_id === adminUserId;
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                      isAdmin
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isAdmin ? "text-blue-200" : "text-gray-400"}`}>
                        {fmtTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={msgBottomRef} />
          </div>

          {/* Composer */}
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder="Type a message…"
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              className="min-h-[60px] max-h-[120px] resize-none flex-1"
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
              }}
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!msgText.trim() || sending || !msgConvId}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            The student will see this in their Messages section.
          </p>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default SuperAdmin;
