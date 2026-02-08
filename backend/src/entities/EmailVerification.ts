import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("email_verifications")
export class EmailVerification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column({ length: 6 })
  code!: string;

  @Column()
  purpose!: string;

  @Column({ type: "datetime" })
  expiresAt!: Date;

  @Column({ type: "datetime", nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
