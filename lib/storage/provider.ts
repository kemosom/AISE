import { createSupabaseServerClient, isSupabaseServerConfigured } from '../supabase/server';

export interface UploadResult {
  url: string;
  storagePath: string;
  key: string;
  size: number;
  contentType: string;
}

export interface StorageProvider {
  uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    options?: { courseId?: string; userId?: string; labId?: string }
  ): Promise<UploadResult>;
  deleteFile(storagePath: string): Promise<void>;
  getUrl(storagePath: string): Promise<string>;
}

/**
 * Supabase Storage Provider.
 * Stores artifacts in the private 'lab-report-assets' bucket under:
 * [courseId]/[userUuid]/[labId]/[assetId]
 */
export class SupabaseStorageProvider implements StorageProvider {
  private bucketName = 'lab-report-assets';

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    options?: { courseId?: string; userId?: string; labId?: string }
  ): Promise<UploadResult> {
    const client = createSupabaseServerClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    const courseId = options?.courseId || 'mai5124';
    const userId = options?.userId || 'anonymous';
    const labId = options?.labId || 'lab01';
    const cleanFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `${courseId}/${userId}/${labId}/${cleanFileName}`;

    const { data, error } = await client.storage
      .from(this.bucketName)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload error, returning local fallback:', error.message);
      const base64Data = fileBuffer.toString('base64');
      const dataUrl = `data:${contentType};base64,${base64Data}`;
      return {
        url: dataUrl,
        storagePath,
        key: storagePath,
        size: fileBuffer.length,
        contentType,
      };
    }

    // Generate signed URL (expires in 1 year for authenticated viewing)
    const { data: signedData } = await client.storage
      .from(this.bucketName)
      .createSignedUrl(data.path, 365 * 24 * 60 * 60);

    const publicOrSignedUrl = signedData?.signedUrl || `/api/storage/${encodeURIComponent(data.path)}`;

    return {
      url: publicOrSignedUrl,
      storagePath: data.path,
      key: data.path,
      size: fileBuffer.length,
      contentType,
    };
  }

  async deleteFile(storagePath: string): Promise<void> {
    const client = createSupabaseServerClient();
    if (client) {
      await client.storage.from(this.bucketName).remove([storagePath]);
    }
  }

  async getUrl(storagePath: string): Promise<string> {
    const client = createSupabaseServerClient();
    if (!client) return storagePath;

    const { data } = await client.storage
      .from(this.bucketName)
      .createSignedUrl(storagePath, 3600);

    return data?.signedUrl || storagePath;
  }
}

/**
 * Built-in Data URI Storage Provider for rapid local development without credentials.
 */
export class LocalDataStorageProvider implements StorageProvider {
  private inMemoryStore = new Map<string, { data: string; contentType: string }>();

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    options?: { courseId?: string; userId?: string; labId?: string }
  ): Promise<UploadResult> {
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64Data}`;
    const courseId = options?.courseId || 'mai5124';
    const userId = options?.userId || 'user-local';
    const labId = options?.labId || 'lab01';
    const storagePath = `${courseId}/${userId}/${labId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    this.inMemoryStore.set(storagePath, { data: dataUrl, contentType });

    return {
      url: dataUrl,
      storagePath,
      key: storagePath,
      size: fileBuffer.length,
      contentType,
    };
  }

  async deleteFile(storagePath: string): Promise<void> {
    this.inMemoryStore.delete(storagePath);
  }

  async getUrl(storagePath: string): Promise<string> {
    const item = this.inMemoryStore.get(storagePath);
    return item ? item.data : storagePath;
  }
}

export function getStorageProvider(): StorageProvider {
  if (isSupabaseServerConfigured()) {
    return new SupabaseStorageProvider();
  }
  return new LocalDataStorageProvider();
}
