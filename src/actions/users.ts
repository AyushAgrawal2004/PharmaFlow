'use server';

import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type SignupInput = z.infer<typeof signupSchema>;

export async function registerUserAction(input: SignupInput) {
  try {
    const validated = signupSchema.parse(input);
    const emailNormalized = validated.email.toLowerCase();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create the user with default SELLER role
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: emailNormalized,
        password: hashedPassword,
        role: 'SELLER',
      },
    });

    return { 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to complete registration.' };
  }
}
