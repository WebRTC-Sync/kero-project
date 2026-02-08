import nodemailer from "nodemailer";
import { IsNull } from "typeorm";
import { AppDataSource } from "../config/database";
import { EmailVerification } from "../entities/EmailVerification";

const verificationRepository = AppDataSource.getRepository(EmailVerification);

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME || "tapons122@gmail.com",
    pass: process.env.MAIL_PASSWORD || "cfyg ikpr dlqi jdaw",
  },
});

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class EmailService {
  async sendVerificationCode(email: string, purpose: string): Promise<void> {
    await verificationRepository.delete({ email, verifiedAt: IsNull() });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const verification = verificationRepository.create({ email, code, purpose, expiresAt });
    await verificationRepository.save(verification);

    const purposeText = purpose === "RESET_PASSWORD" ? "비밀번호 재설정" : "이메일 인증";

    await transporter.sendMail({
      from: process.env.MAIL_USERNAME || "tapons122@gmail.com",
      to: email,
      subject: `[KERO] ${purposeText} 인증번호`,
      text: `안녕하세요, KERO입니다.\n\n${purposeText}을 위한 인증번호입니다.\n\n인증번호: ${code}\n\n이 인증번호는 10분간 유효합니다.\n본인이 요청하지 않은 경우 이 메일을 무시하세요.\n\n감사합니다.\nKERO 팀`,
    });
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const verification = await verificationRepository.findOne({
      where: { email, code },
      order: { createdAt: "DESC" },
    });
    if (!verification) {
      return false;
    }
    if (verification.verifiedAt) {
      return false;
    }
    if (new Date() > verification.expiresAt) {
      return false;
    }

    verification.verifiedAt = new Date();
    await verificationRepository.save(verification);
    return true;
  }

  async isVerified(email: string): Promise<boolean> {
    const verification = await verificationRepository.findOne({
      where: { email },
      order: { createdAt: "DESC" },
    });
    if (!verification || !verification.verifiedAt) {
      return false;
    }

    return Date.now() - verification.verifiedAt.getTime() < 15 * 60 * 1000;
  }
}

export const emailService = new EmailService();
