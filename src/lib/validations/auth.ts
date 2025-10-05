import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  remember: z.boolean().optional(),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, { message: 'Full name is required' }),
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
});

export const profileSetupSchema = z.object({
  displayName: z.string().trim().min(1, { message: 'Display name is required' }),
  timezone: z.string(),
  notificationEmail: z.boolean(),
  notificationPush: z.boolean(),
});

export const workspaceSetupSchema = z.object({
  action: z.enum(['create', 'join', 'skip']),
  organizationName: z.string().optional(),
  inviteCode: z.string().optional(),
}).refine(
  (data) => {
    if (data.action === 'create' && !data.organizationName?.trim()) {
      return false;
    }
    if (data.action === 'join' && !data.inviteCode?.trim()) {
      return false;
    }
    return true;
  },
  {
    message: 'Required field is missing',
    path: ['organizationName'],
  }
);

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;
export type WorkspaceSetupInput = z.infer<typeof workspaceSetupSchema>;
