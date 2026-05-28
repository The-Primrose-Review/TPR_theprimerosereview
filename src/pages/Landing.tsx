import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, UserCircle, Eye, Building2, BookOpen } from "lucide-react";
import primroseLogo from "@/assets/primrose-logo.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex flex-col items-center justify-center p-6">
      
      {/* View Demo + Demo Maker - top left */}
      {/* <div className="absolute top-6 left-6 flex gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate('/demo')}
        >
          <Eye className="h-4 w-4" />
          View Demo
        </Button>
      </div> */}
      
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src={primroseLogo} 
            alt="The Primrose Review" 
            className="h-20 w-auto"
          />
        </div>

        {/* Welcome Text */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground">
            Welcome to The Primrose Review
          </h1>
          <p className="text-lg text-muted-foreground">
            College Application Management System
          </p>
        </div>

        {/* Login Options */}
        <Card className="p-8 space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Sign in as:</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => navigate('/auth?role=counselor')}
              >
                <GraduationCap className="h-8 w-8" />
                <span className="font-medium">Counselor
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => navigate('/auth?role=principal')}
              >
                <Building2 className="h-8 w-8" />
                <span className="font-medium">Principal</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => navigate('/auth?role=student')}
              >
                <Users className="h-8 w-8" />
                <span className="font-medium">Student</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 w-2/3 mx-auto">
              <Button
                variant="outline"
                className="h-24 flex-col gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => navigate('/auth?role=parent')}
              >
                <UserCircle className="h-8 w-8" />
                <span className="font-medium">Parent</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-3 hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => navigate('/auth?role=teacher')}
              >
                <BookOpen className="h-8 w-8" />
                <span className="font-medium">Teacher</span>
              </Button>
            </div>
          </div>

          {/* Signup link */}
          <div className="pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Don't have an account? </span>
            <button
              className="text-sm text-primary font-medium hover:underline"
              onClick={() => navigate('/auth')}
            >
              Sign up here
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Landing;