import { useMemo, useState } from "react";
import { GraduationCap, Users, FileText, Calendar, BarChart3, MessageSquare, Bell, UserCircle, BookOpen, Award, Home, PartyPopper, Settings, Building2, ShieldAlert, Star, Zap, FlaskConical, Eye, ArrowLeft, Trophy, Calculator, ChevronDown, ChevronRight, FlaskRound, Cpu, Sparkles, LogOut } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type UserRole = 'counselor' | 'student' | 'parent' | 'principal';

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: number;
  tourId?: string;
}

const mainItems: NavItem[] = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: BarChart3
}, {
  title: "Students",
  url: "/students",
  icon: Users
}, {
  title: "Essays",
  url: "/essays",
  icon: FileText
}, {
  title: "Applications",
  url: "/applications",
  icon: Calendar
}, {
  title: "Recommendation Letters",
  url: "/recommendation-letters",
  icon: Award
}, {
  title: "Messages",
  url: "/messages",
  icon: MessageSquare,
  badge: 3
}, {
  title: "Notifications",
  url: "/notifications",
  icon: Bell
}, {
  title: "Student Experience",
  url: "/preview/student-dashboard",
  icon: Eye,
}];

const studentTopItems: NavItem[] = [{
  title: "Student Dashboard",
  url: "/student-dashboard",
  icon: UserCircle,
  tourId: "tour-nav-dashboard",
}];

const studentBottomItems: NavItem[] = [{
  title: "Recommendation Letters",
  url: "/student-recommendation-letters",
  icon: Award,
  tourId: "tour-nav-rec",
}, {
  title: "Messages",
  url: "/student-messages",
  icon: MessageSquare,
  badge: 3,
  tourId: "tour-nav-messages",
}, {
  title: "My Profile",
  url: "/student-profile",
  icon: UserCircle,
}];

const additionalToolItems: NavItem[] = [
  { title: "Weekly Challenge", url: "/weekly-challenge", icon: Trophy },
  { title: "Scholarship Finder", url: "/scholarship-finder", icon: Star },
  { title: "Tuition Calculator", url: "/tuition-calculator", icon: Calculator },
];

const feedbackItem: NavItem = { title: "Feedback", url: "/student-feedback", icon: Star };

const studentStandaloneItems = [...studentTopItems, ...studentBottomItems, ...additionalToolItems, feedbackItem];

const studentSections = [
  {
    key: "lab",
    label: "Stress-test your idea",
    icon: FlaskRound,
    items: [
      { title: "Primrose Lab", url: "/primrose-lab", icon: FlaskConical },
    ] as NavItem[],
  },
  {
    key: "engine",
    label: "Evaluate your full essay",
    icon: Cpu,
    items: [
      { title: "Evaluation Engine", url: "/evaluation-engine", icon: Zap },
    ] as NavItem[],
  },
  {
    key: "generate",
    label: "Generate and Submit your essay",
    icon: Sparkles,
    items: [
      { title: "My Work", url: "/student-personal-area", icon: BookOpen, tourId: "tour-nav-my-work" },
      { title: "My Stats", url: "/student-stats", icon: BarChart3, tourId: "tour-nav-stats" },
    ] as NavItem[],
  },
];

// Flat list of all student items (used for preview mode)
const studentItems: NavItem[] = [
  ...studentStandaloneItems,
  ...studentSections.flatMap(s => s.items),
];

const parentItems = [{
  title: "Parent Portal",
  url: "/parent-portal",
  icon: Home
}, {
  title: "School Activities",
  url: "/school-activities",
  icon: PartyPopper
}, {
  title: "Messages",
  url: "/parent-messages",
  icon: MessageSquare
}];

const principalItems = [{
  title: "Overview",
  url: "/principal-dashboard",
  icon: BarChart3
}, {
  title: "Students",
  url: "/principal-students",
  icon: Users
}, {
  title: "Counselors",
  url: "/principal-counselors",
  icon: Building2
}, {
  title: "School Activities",
  url: "/principal-activities",
  icon: PartyPopper
}, {
  title: "At Risk Criteria",
  url: "/principal-at-risk-criteria",
  icon: ShieldAlert
}, {
  title: "School Settings",
  url: "/principal-settings",
  icon: Settings
}, {
  title: "Student Experience",
  url: "/preview/student-dashboard",
  icon: Eye,
}];

// Routes that belong to each role
const studentRoutes = ['/student-dashboard', '/primrose-lab', '/scholarship-finder', '/tuition-calculator', '/student-personal-area', '/student-recommendation-letters', '/student-stats', '/submit-essay', '/add-application', '/student-messages', '/personal-essay', '/student-feedback', '/evaluation-engine', '/weekly-challenge'];
const parentRoutes = ['/parent-portal', '/school-activities', '/parent-messages'];
const principalRoutes = ['/principal-dashboard', '/principal-students', '/principal-counselors', '/principal-activities', '/principal-at-risk-criteria', '/principal-settings'];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ lab: true, engine: true, generate: true, additional: true });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const isPreviewMode = currentPath.startsWith('/preview/');

  // Store exit path when entering preview so back button knows where to return
  const previewExitPath = isPreviewMode
    ? (sessionStorage.getItem('previewExitPath') ?? '/dashboard')
    : null;

  // Determine current user role based on the route
  const currentRole: UserRole = useMemo(() => {
    if (isPreviewMode) return 'student';
    if (studentRoutes.some(route => currentPath.startsWith(route))) return 'student';
    if (parentRoutes.some(route => currentPath.startsWith(route))) return 'parent';
    if (principalRoutes.some(route => currentPath.startsWith(route))) return 'principal';
    return 'counselor';
  }, [currentPath, isPreviewMode]);

  // When in preview mode, remap student item URLs to /preview/* versions
  const resolvedStudentItems: NavItem[] = useMemo(() => {
    if (!isPreviewMode) return studentItems;
    return studentItems.map(item => ({ ...item, url: `/preview${item.url}` }));
  }, [isPreviewMode]);

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground";

  const renderMenuItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end
          className={getNavCls}
          id={item.tourId}
          onClick={() => {
            if (item.url === '/preview/student-dashboard') {
              sessionStorage.setItem('previewExitPath', currentPath);
            }
          }}
        >
          <item.icon className="h-4 w-4" />
          {open && (
            <>
              <span>{item.title}</span>
              {item.badge && (
                <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <>
      <Sidebar className={open ? "w-64" : "w-16"} variant="sidebar">
        <SidebarContent>
          {/* Logo Section */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              {open && (
                <div>
                  <h1 className="font-bold text-foreground">The Primrose Review</h1>
                  <p className="text-xs text-muted-foreground">CRM Platform</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview mode: back button + student nav */}
          {isPreviewMode && (
            <>
              <div className="px-3 pt-3 pb-1">
                <button
                  onClick={() => navigate(previewExitPath ?? '/dashboard')}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full px-2 py-1.5 rounded-md hover:bg-accent"
                >
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                  {open && <span>Exit student preview</span>}
                </button>
              </div>
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center gap-1.5">
                  <Eye className="h-3 w-3" />
                  {open && "Student Preview"}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {resolvedStudentItems.map(item => renderMenuItem(item))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}

          {!isPreviewMode && currentRole === 'counselor' && (
            <SidebarGroup>
              <SidebarGroupLabel>Counselor</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainItems.map(item => renderMenuItem(item))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {!isPreviewMode && currentRole === 'student' && (
            <SidebarGroup>
              <SidebarGroupLabel>Student Portal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {studentTopItems.map(item => renderMenuItem(item))}
                  {open && (
                    <div className="px-2 pt-3 pb-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Essay Journey</p>
                    </div>
                  )}
                  {studentSections.map(section => (
                    <Collapsible key={section.key} open={openSections[section.key]} onOpenChange={() => toggleSection(section.key)}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full">
                            <section.icon className="h-4 w-4 shrink-0" />
                            {open && (
                              <>
                                <span className="flex-1 text-left">{section.label}</span>
                                {openSections[section.key]
                                  ? <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                                  : <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {section.items.map(item => (
                              <SidebarMenuSubItem key={item.title}>
                                <SidebarMenuSubButton asChild>
                                  <NavLink
                                    to={item.url}
                                    end
                                    className={getNavCls}
                                    id={item.tourId}
                                  >
                                    <item.icon className="h-4 w-4" />
                                    {open && <span>{item.title}</span>}
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ))}
                  {studentBottomItems.map(item => renderMenuItem(item))}
                  <Collapsible open={openSections["additional"]} onOpenChange={() => toggleSection("additional")}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full">
                          <Trophy className="h-4 w-4 shrink-0" />
                          {open && (
                            <>
                              <span className="flex-1 text-left">Additional Tools</span>
                              {openSections["additional"]
                                ? <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                                : <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {additionalToolItems.map(item => (
                            <SidebarMenuSubItem key={item.title}>
                              <SidebarMenuSubButton asChild>
                                <NavLink to={item.url} end className={getNavCls}>
                                  <item.icon className="h-4 w-4" />
                                  {open && <span>{item.title}</span>}
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                  {renderMenuItem(feedbackItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {!isPreviewMode && currentRole === 'parent' && (
            <SidebarGroup>
              <SidebarGroupLabel>Parent Portal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {parentItems.map(item => renderMenuItem(item))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {!isPreviewMode && currentRole === 'principal' && (
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {principalItems.map(item => renderMenuItem(item))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

        </SidebarContent>

        <SidebarFooter className="border-t border-border p-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {open && <span>Log out</span>}
          </button>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
