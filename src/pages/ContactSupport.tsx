import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ContactSupport = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.full_name) setUserName(profile.full_name);
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (roleRow?.role) setUserRole(roleRow.role);
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("support-ticket", {
        body: { subject, message, userName, userEmail, userRole },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast({
        title: "Something went wrong",
        description: "We couldn't send your message. Please try again or email us directly at team@primrosecrm.com.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Message received</h2>
          <p className="text-muted-foreground leading-relaxed">
            Thank you for reaching out. Our team will review your message and get back to you as soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); }}>
              Send another message
            </Button>
            <Link to="/">
              <Button>Back to dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Contact Support</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Experiencing a technical issue, something not working as expected, or have a question about the platform?
          Let us know and our team will get back to you as soon as possible.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {(userName || userEmail) && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground space-y-0.5">
              {userName && <p><span className="font-medium text-foreground">Name:</span> {userName}</p>}
              {userEmail && <p><span className="font-medium text-foreground">Email:</span> {userEmail}</p>}
              {userRole && <p><span className="font-medium text-foreground">Role:</span> <span className="capitalize">{userRole}</span></p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Please describe the issue or question in as much detail as possible. Include any steps to reproduce a bug, the page you were on, and what you expected to happen."
              className="min-h-[180px] resize-none"
              required
            />
            <p className="text-xs text-muted-foreground text-right">{message.length} characters</p>
          </div>

          <Button
            type="submit"
            disabled={submitting || !subject.trim() || !message.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
              : <><Send className="h-4 w-4" /> Submit Request</>
            }
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Or email us directly at{" "}
            <a href="mailto:team@primrosecrm.com" className="text-primary hover:underline">
              team@primrosecrm.com
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ContactSupport;
