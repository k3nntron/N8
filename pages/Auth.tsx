import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "/logo.png";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(20, "Username too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
});

type AuthFormData = z.infer<typeof registerSchema> | z.infer<typeof loginSchema>;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invite = params.get("invite");
    if (invite) {
      localStorage.setItem("pending_invite_code", invite);
    }
  }, [location.search]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<AuthFormData>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (isLogin) {
        const session = await signIn(data.email, data.password);
        if (!session) {
          toast.error("Login not completed. Please check your email verification or credentials.");
          return;
        }
        toast.success("Welcome back!");
        const pendingInvite = localStorage.getItem("pending_invite_code");
        if (pendingInvite) {
          localStorage.removeItem("pending_invite_code");
          navigate(`/invite/${pendingInvite}`);
          return;
        }
        navigate("/app");
      } else {
        const session = await signUp(data.email, data.password, data.username!);
        if (!session) {
          toast.info("Account created. Please check your email to confirm before logging in.");
          return;
        }
        toast.success("Account created!");
        const pendingInvite = localStorage.getItem("pending_invite_code");
        if (pendingInvite) {
          localStorage.removeItem("pending_invite_code");
          navigate(`/invite/${pendingInvite}`);
          return;
        }
        navigate("/app");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
      
      if (message.includes("email")) {
        setError("email", { message });
      } else if (message.includes("password")) {
        setError("password", { message });
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md rounded-xl bg-card p-8 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={logo} alt="N8" className="w-10 h-10" width={40} height={40} />
          <span className="font-extrabold text-2xl text-foreground">N8</span>
        </div>

        <h2 className="text-xl font-bold text-foreground text-center mb-2">
          {isLogin ? "Welcome back!" : "Create an account"}
        </h2>
        <p className="text-muted-foreground text-center text-sm mb-6">
          {isLogin ? "We're so excited to see you again!" : "Join N8 and start chatting with friends"}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs font-bold uppercase text-secondary-foreground mb-1 block">Username</label>
              <input
                type="text"
                {...register("username")}
                className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="cooluser123"
              />
              {errors.username && (
                <p className="text-destructive text-xs mt-1">{errors.username.message}</p>
              )}
            </div>
          )}
          
          <div>
            <label className="text-xs font-bold uppercase text-secondary-foreground mb-1 block">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase text-secondary-foreground mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-md gradient-blurple text-primary-foreground font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? "Loading..." : isLogin ? "Log In" : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          {isLogin ? "Need an account? " : "Already have an account? "}
          <button
            onClick={toggleMode}
            className="text-blurple hover:underline font-medium"
          >
            {isLogin ? "Register" : "Log In"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
