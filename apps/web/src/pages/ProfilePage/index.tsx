import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../context/AuthContext";
import { userAPI } from "../../api/index";

// Components
import { ProfileHeader } from "./components/ProfileHeader";
import { RiskBanner } from "./components/RiskBanner";
import { ProfileForm } from "./components/ProfileForm";
import { ProfileSidebar } from "./components/ProfileSidebar";

// Constants & Types
import { profileSchema } from "./constants";

export default function ProfilePage() {
  const { user, setUser } = useAuth() as any;
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        monthlyIncome: user.monthlyIncome || 0,
        extraBudget: user.extraBudget || 0,
        capital: user.investorProfile?.capital || 0,
        goal: user.investorProfile?.goal || "GROWTH",
        horizon: user.investorProfile?.horizon || "MEDIUM",
        riskLevel: user.investorProfile?.riskLevel || "MEDIUM",
        savingsRate: user.investorProfile?.savingsRate ?? 6.0,
        inflationRate: user.investorProfile?.inflationRate ?? 3.5,
      });
    }
  }, [user, reset]);

  const fetchUser = async () => {
    try {
      const res = await userAPI.getProfile();
      setUser(res.data.data);
    } catch (e) {
      console.error("Fetch user error:", e);
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await userAPI.updateProfile(data);
      setUser((prev: any) => ({ ...prev, ...res.data.data.user }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Update profile error:", e);
    } finally {
      setLoading(false);
    }
  };

  const riskScore = user?.investorProfile?.riskScore;
  const hasCompletedQuiz = riskScore !== undefined && riskScore !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pb-10 space-y-8"
    >
      {/* Header Section */}
      <ProfileHeader user={user} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Main Column */}
        <div className="xl:col-span-2 space-y-6">
          <RiskBanner user={user} />
          
          <ProfileForm 
            register={register}
            handleSubmit={handleSubmit}
            control={control}
            errors={errors}
            onSubmit={onSubmit}
            onUpdate={fetchUser}
            loading={loading}
            saved={saved}
            user={user}
            hasCompletedQuiz={hasCompletedQuiz}
          />
        </div>

        {/* Sidebar Column */}
        <div className="xl:sticky xl:top-6">
          <ProfileSidebar 
            user={user} 
            hasCompletedQuiz={hasCompletedQuiz} 
          />
        </div>
      </div>
    </motion.div>
  );
}
