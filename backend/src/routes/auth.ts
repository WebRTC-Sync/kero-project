import { Router, Request, Response } from "express";
import { authService } from "../services/AuthService";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { emailService } from "../services/EmailService";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;
    const user = await authService.register({ name, email, phone, password });
    res.status(201).json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    res.json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, profileImage: user.profileImage, createdAt: user.createdAt }, token },
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
});

router.post("/social-login", async (req: Request, res: Response) => {
  try {
    const { provider, providerId, email, name, profileImage } = req.body;
    const { user, token } = await authService.socialLogin({ provider, providerId, email, name, profileImage });
    res.json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, profileImage: user.profileImage, createdAt: user.createdAt }, token },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/kakao-login", async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.query;
    if (!code || !redirectUri) {
      return res.status(400).json({ success: false, message: "code와 redirectUri가 필요합니다." });
    }

    const { user, token } = await authService.kakaoLogin(String(code), String(redirectUri));
    res.json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, profileImage: user.profileImage, createdAt: user.createdAt }, token },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/profile", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "인증이 필요합니다." });
    }

    const { name, profileImage } = req.body;
    const updatedUser = await authService.updateProfile(userId, { name, profileImage });

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete("/account", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "인증이 필요합니다." });
    }

    await authService.deleteAccount(userId);
    res.json({ success: true, message: "계정이 삭제되었습니다." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/send-verification", async (req: Request, res: Response) => {
  try {
    const { email, purpose } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "이메일이 필요합니다." });
    }

    await emailService.sendVerificationCode(email, purpose || "RESET_PASSWORD");
    res.json({ success: true, message: "인증번호가 발송되었습니다." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "인증번호 발송에 실패했습니다." });
  }
});

router.post("/verify-code", async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const verified = await emailService.verifyCode(email, code);
    if (!verified) {
      return res.status(400).json({ success: false, message: "인증번호가 올바르지 않거나 만료되었습니다." });
    }

    res.json({ success: true, message: "인증이 완료되었습니다." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    const verified = await emailService.isVerified(email);
    if (!verified) {
      return res.status(400).json({ success: false, message: "이메일 인증이 완료되지 않았습니다." });
    }

    await authService.resetPassword(email, newPassword);
    res.json({ success: true, message: "비밀번호가 성공적으로 변경되었습니다." });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
