import { supabase } from '../lib/supabase';

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ error: string | null }> {
  try {
    // First verify the current user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    // Update the password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
}

export async function resetPasswordRequest(email: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'An unexpected error occurred' };
  }
}
