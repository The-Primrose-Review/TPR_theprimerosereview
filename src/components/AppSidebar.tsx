import { useMemo } from "react";
import { GraduationCap, Users, FileText, Calendar, BarChart3, MessageSquare, Bell, UserCircle, BookOpen, Award, Home, PartyPopper, Settings, Building2, ShieldAlert, Star, Zap, FlaskConical, Eye, ArrowLeft } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

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

const studentItems: NavItem[] = [{
  title: "Student Dashboard",
  url: "/student-dashboard",
  icon: UserCircle,
  tourId: "tour-nav-dashboard",
}, {
  title: "Primrose Lab",
  url: "/primrose-lab",
  icon: FlaskConical,
}, {
  title: "My Work",
  url: "/student-personal-area",
  icon: BookOpen,
  tourId: "tour-nav-my-work",
}, {
  title: "Recommendation Letters",
  url: "/student-recommendation-letters",
  icon: Award,
  tourId: "tour-nav-rec",
}, {
  title: "My Stats",
  url: "/student-stats",
  icon: BarChart3,
  tourId: "tour-nav-stats",
}, {
  title: "Messages",
  url: "/student-messages",
  icon: MessageSquare,
  badge: 3,
  tourId: "tour-nav-messages",
}, {
  title: "Feedback",
  url: "/student-feedback",
  icon: Star,
}, {
  title: "Evaluation Engine",
  url: "/evaluation-engine",
  icon: Zap,
}];

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
const studentRoutes = ['/student-dashboard', '/primrose-lab', '/student-personal-area', '/student-recommendation-letters', '/student-stats', '/submit-essay', '/add-application', '/student-messages', '/personal-essay', '/student-feedback', '/evaluation-engine'];
const parentRoutes = ['/parent-portal', '/school-activities', '/parent-messages'];
const principalRoutes = ['/principal-dashboard', '/principal-students', '/principal-counselors', '/principal-activities', '/principal-at-risk-criteria', '/principal-settings'];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

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
                  {studentItems.map(item => renderMenuItem(item))}
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
      </Sidebar>
    </>
  );
}
