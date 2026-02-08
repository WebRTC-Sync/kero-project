"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Music, Eye, EyeOff, Check, Loader2, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const TERMS_OF_SERVICE = `제1조 (목적)
이 약관은 KERO(이하 "서비스")가 제공하는 온라인 노래방 서비스의 이용과 관련하여, 서비스와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 KERO가 제공하는 온라인 노래방, 노래 퀴즈 등 관련 서비스를 말합니다.
2. "이용자"란 이 약관에 따라 서비스를 이용하는 회원을 말합니다.
3. "회원"이란 서비스에 회원가입을 한 자를 말합니다.

제3조 (약관의 효력)
1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
2. 서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지함으로써 효력이 발생합니다.

제4조 (회원가입)
1. 이용자는 서비스가 정한 절차에 따라 회원가입을 신청합니다.
2. 서비스는 다음 각 호에 해당하지 않는 한 회원가입을 승낙합니다.
   - 타인의 정보를 이용한 경우
   - 필수 정보를 허위로 기재한 경우

제5조 (서비스 이용)
1. 서비스 이용은 회원가입 후 가능합니다.
2. 서비스는 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴 24시간 제공합니다.

제6조 (이용자의 의무)
1. 이용자는 관련 법령 및 이 약관의 규정을 준수하여야 합니다.
2. 이용자는 타인의 권리를 침해하는 행위를 하여서는 안 됩니다.
3. 이용자는 서비스의 안정적 운영을 방해하는 행위를 하여서는 안 됩니다.

제7조 (회원 탈퇴)
회원은 언제든지 서비스에 탈퇴를 요청할 수 있으며, 서비스는 즉시 회원 탈퇴를 처리합니다.`;

const PRIVACY_POLICY = `1. 개인정보의 수집 및 이용 목적
KERO는 다음의 목적을 위하여 개인정보를 처리합니다.
- 회원가입 및 관리: 회원 식별, 서비스 제공
- 서비스 제공: 노래방 서비스, 퀴즈 기능 제공
- 고객 지원: 문의 대응, 공지사항 전달

2. 수집하는 개인정보 항목
- 필수항목: 이름, 이메일, 연락처, 비밀번호
- 선택항목: 프로필 이미지
- 소셜 로그인 시: 소셜 계정 식별자, 이메일, 이름, 프로필 이미지

3. 개인정보의 보유 및 이용 기간
- 회원 탈퇴 시까지
- 단, 관련 법령에 의한 보존 의무가 있는 경우 해당 기간까지

4. 개인정보의 파기
회원 탈퇴 시 개인정보는 지체 없이 파기합니다.

5. 개인정보의 제3자 제공
KERO는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한 경우는 예외로 합니다.

6. 이용자의 권리
이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있으며 회원 탈퇴를 통해 개인정보 처리를 거부할 수 있습니다.

7. 개인정보 보호책임자
서비스 운영팀 (kero.support@email.com)`;

function TermsModal({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: string }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg max-h-[80vh] bg-zinc-900 border border-white/10 rounded-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
        </div>
        <div className="p-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-medium text-black bg-white hover:bg-gray-100 transition-colors"
          >
            확인
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "회원가입에 실패했습니다.");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("서버 연결에 실패했습니다.");
      setLoading(false);
    }
  };

  const passwordMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== "";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#C0C0C0]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl" />
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
          <h1 className="text-2xl font-bold text-white mb-2">회원가입</h1>
          <p className="text-gray-400 mb-8">KERO와 함께 노래를 시작하세요</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C0C0C0] transition-colors"
                placeholder="홍길동"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">연락처</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C0C0C0] transition-colors"
                placeholder="010-1234-5678"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">이메일</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C0C0C0] transition-colors"
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C0C0C0] transition-colors pr-12"
                  placeholder="8자 이상 입력"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors pr-12 ${
                    passwordMatch ? "border-green-500" : "border-white/10 focus:border-[#C0C0C0]"
                  }`}
                  placeholder="비밀번호 재입력"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {passwordMatch && <Check className="w-5 h-5 text-green-500" />}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <input type="checkbox" required className="mt-1 rounded bg-white/5 border-white/10" />
              <span className="text-gray-400">
                <button type="button" onClick={() => setShowTerms(true)} className="text-[#C0C0C0] hover:text-white transition-colors underline underline-offset-2">이용약관</button> 및{" "}
                <button type="button" onClick={() => setShowPrivacy(true)} className="text-[#C0C0C0] hover:text-white transition-colors underline underline-offset-2">개인정보처리방침</button>에 동의합니다
              </span>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-[#C0C0C0] to-[#FFD700] text-black font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  가입 중...
                </>
              ) : (
                "가입하기"
              )}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-[#C0C0C0] hover:text-white transition-colors font-medium">
                로그인
              </Link>
            </p>
          </div>
        </div>

        <AnimatePresence>
          <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} title="이용약관" content={TERMS_OF_SERVICE} />
        </AnimatePresence>
        <AnimatePresence>
          <TermsModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="개인정보처리방침" content={PRIVACY_POLICY} />
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
