"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const provider = params.provider as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (provider === "google") {
          const hash = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get("access_token");

          if (!accessToken) {
            setError("Google 인증 토큰을 받지 못했습니다.");
            return;
          }

          const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const userInfo = await userInfoRes.json();

          if (!userInfo.email) {
            setError("Google 계정 정보를 가져올 수 없습니다.");
            return;
          }

          const res = await fetch("/api/auth/social-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "google",
              providerId: userInfo.id,
              email: userInfo.email,
              name: userInfo.name || userInfo.email.split("@")[0],
              profileImage: userInfo.picture || null,
            }),
          });

          const data = await res.json();
          if (!data.success) {
            setError(data.message || "소셜 로그인에 실패했습니다.");
            return;
          }

          if (window.opener) {
            window.opener.postMessage(
              {
                type: "SOCIAL_LOGIN_SUCCESS",
                payload: {
                  token: data.data.token,
                  user: data.data.user,
                },
              },
              window.location.origin
            );
            window.close();
          }
        } else if (provider === "kakao") {
          const code = searchParams.get("code");

          if (!code) {
            setError("카카오 인증 코드를 받지 못했습니다.");
            return;
          }

          const redirectUri = `${window.location.origin}/auth/kakao/callback`;

          const res = await fetch(`/api/auth/kakao-login?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(redirectUri)}`);
          const data = await res.json();

          if (!data.success) {
            setError(data.message || "카카오 로그인에 실패했습니다.");
            return;
          }

          if (window.opener) {
            window.opener.postMessage(
              {
                type: "SOCIAL_LOGIN_SUCCESS",
                payload: {
                  token: data.data.token,
                  user: data.data.user,
                },
              },
              window.location.origin
            );
            window.close();
          }
        } else {
          setError("지원하지 않는 로그인 방식입니다.");
        }
      } catch {
        setError("로그인 처리 중 오류가 발생했습니다.");
      }
    };

    handleCallback();
  }, [provider, searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {error ? (
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            창 닫기
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-gray-400">로그인 처리 중...</p>
        </div>
      )}
    </div>
  );
}
