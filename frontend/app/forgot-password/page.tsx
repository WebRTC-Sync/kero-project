"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Music, Eye, EyeOff, Loader2, Mail, ArrowLeft, Check } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "인증 코드 전송에 실패했습니다.");
        setLoading(false);
        return;
      }
      setStep("code");
    } catch {
      setError("서버 연결에 실패했습니다.");
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!code) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "인증 코드가 올바르지 않습니다.");
        setLoading(false);
        return;
      }
      setStep("reset");
    } catch {
      setError("서버 연결에 실패했습니다.");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "비밀번호 재설정에 실패했습니다.");
        setLoading(false);
        return;
      }
      setStep("done");
    } catch {
      setError("서버 연결에 실패했습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C0C0C0]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Link href="/" className="flex items-center justify-center gap-3 mb-12">
          <Music className="w-8 h-8 text-[#C0C0C0]" />
          <span className="text-4xl font-bold text-white">KERO</span>
        </Link>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/login" className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white">비밀번호 찾기</h1>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {step === "email" && (
            <div className="space-y-5">
              <p className="text-gray-400 text-sm">가입한 이메일 주소를 입력하면 인증 코드를 보내드립니다.</p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C0C0C0] transition-colors"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
              <motion.button
                onClick={handleSendCode}
                disabled={loading || !email}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-[#C0C0C0] to-[#FFD700] text-black font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                인증 코드 전송
              </motion.button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-5">
              <p className="text-gray-400 text-sm"><span className="text-white">{email}</span>으로 전송된 인증 코드를 입력하세요.</p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">인증 코드</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] placeholder-gray-500 focus:outline-none focus:border-[#C0C0C0] transition-colors"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <motion.button
                onClick={handleVerifyCode}
                disabled={loading || !code}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-[#C0C0C0] to-[#FFD700] text-black font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                확인
              </motion.button>
              <button onClick={() => { setStep("email"); setError(""); }} className="w-full text-center text-sm text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> 이메일 다시 입력
              </button>
            </div>
          )}

          {step === "reset" && (
            <div className="space-y-5">
              <p className="text-gray-400 text-sm">새로운 비밀번호를 입력하세요.</p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">새 비밀번호</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C0C0C0] transition-colors pr-12"
                    placeholder="8자 이상 입력"
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">비밀번호 확인</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                    confirmPassword && newPassword === confirmPassword ? "border-green-500" : "border-white/10 focus:border-[#C0C0C0]"
                  }`}
                  placeholder="비밀번호 재입력"
                />
              </div>
              <motion.button
                onClick={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-[#C0C0C0] to-[#FFD700] text-black font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                비밀번호 재설정
              </motion.button>
            </div>
          )}

          {step === "done" && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">비밀번호가 변경되었습니다</p>
                <p className="text-gray-400 text-sm mt-2">새 비밀번호로 로그인하세요.</p>
              </div>
              <motion.button
                onClick={() => router.push("/login")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-[#C0C0C0] to-[#FFD700] text-black font-bold py-3 rounded-xl transition-all hover:opacity-90"
              >
                로그인으로 이동
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
