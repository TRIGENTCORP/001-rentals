import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Battery, Mail, Lock, Zap, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check user role to redirect appropriately
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile?.role === 'admin') {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login failed",
            description: "Invalid email or password. Please check your credentials.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Check user role to redirect appropriately
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();
          
          toast({
            title: "Welcome back!",
            description: "You have been signed in successfully.",
          });
          
          if (profile?.role === 'admin') {
            navigate("/admin");
          } else {
            navigate("/");
          }
        }
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

  const handleGoogleSignIn = async () => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Google sign-in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: redirectUrl
      });

      if (error) {
        toast({
          title: "Password recovery failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setRecoverySent(true);
        toast({
          title: "Recovery email sent",
          description: "Check your email for password reset instructions.",
        });
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

  const handleBackToSignIn = () => {
    setShowPasswordRecovery(false);
    setRecoverySent(false);
    setRecoveryEmail("");
  };

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
              <Zap className="w-5 h-5 text-primary" />
              Welcome Back
            </CardTitle>
            <CardDescription>
              Access your power bank bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
                
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      console.log("Forgot password clicked");
                      setShowPasswordRecovery(true);
                    }}
                    className="text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer underline hover:no-underline font-medium"
                  >
                    Forgot your password?
                  </button>
                </div>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base font-medium"
                  onClick={handleGoogleSignIn}
                >
                  <FcGoogle className="mr-2 h-5 w-5" />
                  Sign in with Google
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a strong password"
                          className="pl-10 h-12"
                          required
                          minLength={6}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters long
                      </p>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base font-medium"
                  onClick={handleGoogleSignIn}
                >
                  <FcGoogle className="mr-2 h-5 w-5" />
                  Sign up with Google
                </Button>
              </TabsContent>
            </Tabs>
            
            {/* Password Recovery Section */}
            {showPasswordRecovery && (
              <div className="mt-6 p-4 border border-border/50 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={handleBackToSignIn}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-medium">Reset Password</h3>
                </div>
                
                {!recoverySent ? (
                  <form onSubmit={handlePasswordRecovery} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recovery-email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="recovery-email"
                          type="email"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="pl-10 h-10"
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-10 text-sm font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="flex justify-center">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-600">Email Sent!</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        We've sent password reset instructions to <strong>{recoveryEmail}</strong>
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Check your email and click the reset link to create a new password.</p>
                      <p className="mt-1">Didn't receive the email? Check your spam folder.</p>
                    </div>
                    <Button
                      onClick={handleBackToSignIn}
                      variant="outline"
                      className="w-full h-10 text-sm"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;