import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Battery, Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [passwordReset, setPasswordReset] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if we have a valid session from the password reset link
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          toast({
            title: "Invalid reset link",
            description: "This password reset link is invalid or has expired. Please request a new one.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        if (session) {
          setIsValidSession(true);
        } else {
          // Try to get session from URL hash if it exists
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (setSessionError) {
              console.error("Set session error:", setSessionError);
              toast({
                title: "Invalid reset link",
                description: "This password reset link is invalid or has expired. Please request a new one.",
                variant: "destructive",
              });
              navigate("/auth");
            } else {
              setIsValidSession(true);
            }
          } else {
            toast({
              title: "Invalid reset link",
              description: "This password reset link is invalid or has expired. Please request a new one.",
              variant: "destructive",
            });
            navigate("/auth");
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        toast({
          title: "An error occurred",
          description: "Please try again later.",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate, toast]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setPasswordReset(true);
        toast({
          title: "Password updated successfully",
          description: "Your password has been reset. You can now sign in with your new password.",
        });
        
        // Redirect to auth page after a short delay
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Verifying reset link...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return null; // Will redirect to auth page
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Battery className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">PowerBank Pro</h1>
            <p className="text-muted-foreground mt-2">Power up your devices anywhere</p>
          </div>

          <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-green-600">Password Reset Complete!</h2>
                  <p className="text-muted-foreground mt-2">
                    Your password has been successfully updated. You can now sign in with your new password.
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Redirecting you to the sign-in page...</p>
                </div>
                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full"
                >
                  Go to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Battery className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">PowerBank Pro</h1>
          <p className="text-muted-foreground mt-2">Power up your devices anywhere</p>
        </div>

        <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Reset Your Password
            </CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="pl-10 pr-10 h-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="pl-10 pr-10 h-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/auth")}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;


