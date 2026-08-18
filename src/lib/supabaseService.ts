import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User, School, Student, Teacher, AuditLogEntry } from '../types';

// ==========================================
// 1. SUPABASE AUTHENTICATION SERVICES
// ==========================================

export async function supabaseSignUp(email: string, password: string, userMetadata?: Record<string, any>) {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        error: null,
        user: { id: `usr_local_${Date.now()}`, email, user_metadata: userMetadata || {} } as any,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: userMetadata || {},
      },
    });

    if (error) {
      console.warn('Supabase auth signUp notice:', error.message);
      return { success: false, error: error.message, user: null };
    }

    return { success: true, error: null, user: data.user };
  } catch (err: any) {
    console.warn('Supabase signUp exception:', err);
    return { success: false, error: err?.message || 'Authentication error', user: null };
  }
}

export async function supabaseSignIn(email: string, password: string) {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        error: null,
        session: { access_token: 'mock-session-token' } as any,
        user: { id: `usr_local_${Date.now()}`, email } as any,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.warn('Supabase auth signIn notice:', error.message);
      return { success: false, error: error.message, session: null, user: null };
    }

    return { success: true, error: null, session: data.session, user: data.user };
  } catch (err: any) {
    console.warn('Supabase signIn exception:', err);
    return { success: false, error: err?.message || 'Login error', session: null, user: null };
  }
}

export async function supabaseSignOut() {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase signOut error:', error.message);
      }
    }
  } catch (err) {
    console.warn('Supabase signOut exception:', err);
  }
}

export async function getSupabaseCurrentUser() {
  try {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    return null;
  }
}

export async function supabaseUpdatePassword(newPassword: string) {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, error: null };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Could not update password' };
  }
}

// ==========================================
// 2. SUPABASE STORAGE SERVICES (FILE UPLOADS)
// ==========================================

export async function uploadToSupabaseStorage(
  bucketName: string,
  path: string,
  fileOrBlob: File | Blob,
  contentType?: string
): Promise<{ success: boolean; url: string | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      // In offline/fallback mode, convert Blob to DataURL for immediate seamless preview
      if (typeof window !== 'undefined' && fileOrBlob instanceof Blob) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              success: true,
              url: (e.target?.result as string) || null,
              error: null,
            });
          };
          reader.onerror = () => {
            resolve({ success: false, url: null, error: 'Could not read image file' });
          };
          reader.readAsDataURL(fileOrBlob);
        });
      }
      return { success: false, url: null, error: 'Supabase storage not configured' };
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, fileOrBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: contentType || (fileOrBlob as File).type || 'image/png',
      });

    if (error) {
      console.warn(`Supabase Storage upload warning (${bucketName}/${path}):`, error.message);
      return { success: false, url: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrlData.publicUrl,
      error: null,
    };
  } catch (err: any) {
    console.warn('Supabase storage upload exception:', err);
    return { success: false, url: null, error: err?.message || 'Storage upload error' };
  }
}

// ==========================================
// 3. SUPABASE MULTI-TENANT DATABASE SERVICES
// ==========================================

export async function supabaseGetRecordById<T>(tableName: string, id: string): Promise<T | null> {
  try {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn(`Supabase getRecordById (${tableName}) notice:`, error.message);
      return null;
    }

    return data as T;
  } catch (err) {
    return null;
  }
}

export async function supabaseGetAllRecords<T>(tableName: string): Promise<T[]> {
  try {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      console.warn(`Supabase getAllRecords (${tableName}) notice:`, error.message);
      return [];
    }

    return (data || []) as T[];
  } catch (err) {
    return [];
  }
}

export async function supabaseGetRecordsBySchool<T>(tableName: string, schoolId: string): Promise<T[]> {
  try {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('schoolId', schoolId);

    if (error) {
      // Also try column name 'school_id' if 'schoolId' produces column missing error
      const { data: dataSnake, error: errorSnake } = await supabase
        .from(tableName)
        .select('*')
        .eq('school_id', schoolId);

      if (errorSnake) {
        console.warn(`Supabase getRecordsBySchool (${tableName}) notice:`, error.message);
        return [];
      }
      return (dataSnake || []) as T[];
    }

    return (data || []) as T[];
  } catch (err) {
    return [];
  }
}

export async function supabaseQuery<T>(
  tableName: string,
  filterFn: (query: any) => any
): Promise<T[]> {
  try {
    if (!isSupabaseConfigured()) return [];
    let q = supabase.from(tableName).select('*');
    q = filterFn(q);
    const { data, error } = await q;

    if (error) {
      console.warn(`Supabase query (${tableName}) notice:`, error.message);
      return [];
    }

    return (data || []) as T[];
  } catch (err) {
    return [];
  }
}

export async function supabaseUpsertRecord<T extends { id?: string }>(
  tableName: string,
  recordData: T
): Promise<T | null> {
  try {
    if (!isSupabaseConfigured()) return recordData;
    const { data, error } = await supabase
      .from(tableName)
      .upsert(recordData as any, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn(`Supabase upsertRecord (${tableName}) notice:`, error.message);
      return recordData;
    }

    return (data as T) || recordData;
  } catch (err) {
    return recordData;
  }
}

export async function supabaseBulkUpsert<T extends { id?: string }>(
  tableName: string,
  records: T[]
): Promise<boolean> {
  try {
    if (!records || records.length === 0) return true;
    if (!isSupabaseConfigured()) return true;

    const { error } = await supabase
      .from(tableName)
      .upsert(records as any, { onConflict: 'id' });

    if (error) {
      console.warn(`Supabase bulkUpsert (${tableName}) notice:`, error.message);
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

export async function supabaseUpdateRecord<T extends { id?: string }>(
  tableName: string,
  id: string,
  updates: Partial<T>
): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) return true;
    const { error } = await supabase
      .from(tableName)
      .update(updates as any)
      .eq('id', id);

    if (error) {
      console.warn(`Supabase updateRecord (${tableName}) notice:`, error.message);
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

export async function supabaseDeleteRecord(tableName: string, id: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) return true;
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`Supabase deleteRecord (${tableName}) notice:`, error.message);
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

export async function supabaseDeleteRecordsBySchool(tableName: string, schoolId: string): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) return true;
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('schoolId', schoolId);

    if (error) {
      await supabase.from(tableName).delete().eq('school_id', schoolId);
    }

    return true;
  } catch (err) {
    return false;
  }
}

// ==========================================
// 4. REALTIME SUBSCRIPTIONS
// ==========================================

export function supabaseSubscribeToTable(
  tableName: string,
  callback: (payload: any) => void
) {
  try {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    const channel = supabase
      .channel(`public:${tableName}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => callback(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn(`Supabase channel subscription warning (${tableName}):`, err);
    return () => {};
  }
}
