import { AppDataSource } from "../config/database";
import { User } from "../entities";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadFile } from "../config/s3";

const userRepository = AppDataSource.getRepository(User);

export class AuthService {
  async register(data: { name: string; email: string; phone: string; password: string }): Promise<User> {
    const existingUser = await userRepository.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new Error("이미 존재하는 이메일입니다.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = userRepository.create({
      ...data,
      password: hashedPassword,
    });

    return userRepository.save(user);
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
     const user = await userRepository.findOne({ where: { email } });
     if (!user) {
       throw new Error("사용자를 찾을 수 없습니다.");
     }

     if (!user.password) {
       throw new Error("소셜 로그인 계정입니다. 소셜 로그인을 이용해주세요.");
     }

     const isValid = await bcrypt.compare(password, user.password);
     if (!isValid) {
       throw new Error("비밀번호가 일치하지 않습니다.");
     }

     if (!process.env.JWT_SECRET) {
       throw new Error("JWT_SECRET environment variable is required");
     }

     const token = jwt.sign(
       { userId: user.id },
       process.env.JWT_SECRET,
       { expiresIn: "7d" }
     );

     return { user, token };
   }

  async socialLogin(data: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    profileImage?: string;
  }): Promise<{ user: User; token: string; isNew: boolean }> {
    if (!data.provider || !data.providerId || !data.email || !data.name) {
      throw new Error("필수 소셜 로그인 정보가 누락되었습니다.");
    }

    let user = await userRepository.findOne({ where: { provider: data.provider, providerId: data.providerId } });
    let isNew = false;

    if (!user) {
      user = await userRepository.findOne({ where: { email: data.email } });
      if (user) {
        user.provider = data.provider;
        user.providerId = data.providerId;
        if (!user.profileImage && data.profileImage) {
          user.profileImage = data.profileImage;
        }
        user = await userRepository.save(user);
      } else {
        user = userRepository.create({
          name: data.name,
          email: data.email,
          provider: data.provider,
          providerId: data.providerId,
          profileImage: data.profileImage,
        });
        user = await userRepository.save(user);
        isNew = true;
      }
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is required");
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return { user, token, isNew };
  }

  async kakaoLogin(code: string, redirectUri: string): Promise<{ user: User; token: string }> {
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID || "b3f613f50d8d7c59b4deaf5f245de42e",
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = (await tokenRes.json()) as {
      error?: string;
      error_description?: string;
      access_token?: string;
    };
    if (tokenData.error) {
      throw new Error("카카오 토큰 발급 실패: " + tokenData.error_description);
    }

    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: "Bearer " + tokenData.access_token },
    });
    const userData = (await userRes.json()) as {
      id: string | number;
      kakao_account?: {
        email?: string;
        profile?: {
          nickname?: string;
          profile_image_url?: string;
        };
      };
    };

    const kakaoId = String(userData.id);
    const kakaoAccount = userData.kakao_account;
    const email = kakaoAccount?.email || `${kakaoId}@kakao.com`;
    const profile = kakaoAccount?.profile;
    const nickname = profile?.nickname || "카카오유저";
    const profileImage = profile?.profile_image_url || undefined;

    const { user, token } = await this.socialLogin({
      provider: "kakao",
      providerId: kakaoId,
      email,
      name: nickname,
      profileImage,
    });

    return { user, token };
  }

  async getUserById(id: string): Promise<User | null> {
    return userRepository.findOne({ where: { id } });
  }

  async updateProfile(
    userId: string,
    data: { name?: string; profileImage?: string }
  ): Promise<User> {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    if (data.name) {
      user.name = data.name;
    }

    if (data.profileImage && !data.profileImage.startsWith("https://")) {
      const base64Data = data.profileImage.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const timestamp = Date.now();
      const key = `profiles/${userId}/${timestamp}.jpg`;
      const imageUrl = await uploadFile(key, buffer, "image/jpeg");
      user.profileImage = imageUrl;
    }

    return userRepository.save(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    await userRepository.remove(user);
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error("해당 이메일로 가입된 계정이 없습니다.");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await userRepository.save(user);
  }
}

export const authService = new AuthService();
