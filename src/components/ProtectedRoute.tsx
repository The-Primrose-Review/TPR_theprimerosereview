import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('student' | 'counselor' | 'admin' | 'parent' | 'principal' | 'teacher')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized' | 'unauthenticated'>('loading');

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatus('unauthenticated');
        return;
      }

      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error || !roleData) {
        setStatus('unauthorized');
        return;
      }

      if (allowedRoles.includes(roleData.role as any)) {
        setStatus('authorized');
      } else {
        setStatus('unauthorized');
      }
    };

    checkRole();
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    const isAdminRoute = location.pathname === '/superadmin';
    return <Navigate to={isAdminRoute ? '/auth?admin=1' : '/auth'} replace />;
  }

  if (status === 'unauthorized') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;