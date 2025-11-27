
/**
 * Each storage adapter should support two ways of storing files:
 * - publically (public URL) - the file can be accessed by anyone by HTTP GET / HEAD request with plain URL
 * - privately (presigned URL) - the file can be accessed by anyone by HTTP GET / HEAD request only with presigned URLs, limited by expiration time
 * 
 */
export interface StorageAdapter {
  /**
   * This method should return the presigned URL for the given key capable of upload (adapter user will call PUT multipart form data to this URL within expiresIn seconds after link generation).
   * By default file which will be uploaded on PUT should be marked for deletion. So if during 24h it is not marked for not deletion, it adapter should delete it forever.
   * The PUT method should fail if the file already exists.
   * 
   * Adapter user will always pass next parameters to the method:
   * @param key - The key of the file to be uploaded e.g. "uploads/file.txt"
   * @param expiresIn - The expiration time in seconds for the presigned URL
   * @param contentType - The content type of the file to be uploaded, e.g. "image/png"
   * 
   * @returns A promise that resolves to an object containing the upload URL and any extra parameters which should be sent with PUT multipart form data
   */
  getUploadSignedUrl(key: string, contentType: string, expiresIn?: number): Promise<{
    uploadUrl: string;
    uploadExtraParams?: Record<string, string>;
  }>;

  /**
   * This method should return the URL for the given key capable of download (200 GET request with response body or 200 HEAD request without response body).
   * If adapter configured to store objects publically, this method should return the public URL of the file.
   * If adapter configured to no allow public storing of images, this method should return the presigned URL for the file.
   * 
   * @param key - The key of the file to be downloaded e.g. "uploads/file.txt"
   * @param expiresIn - The expiration time in seconds for the presigned URL
   */
  getDownloadUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * This method should mark the file for deletion.
   * If file is marked for delation and exists more then 24h (since creation date) it should be deleted.
   * This method should work even if the file does not exist yet (e.g. only presigned URL was generated).
   * @param key - The key of the file to be uploaded e.g. "uploads/file.txt"
   */
  markKeyForDeletation(key: string): Promise<void>; //TODO delete after one year
  markKeyForDeletion(key: string): Promise<void>;


  /**
   * This method should mark the file to not be deleted.
   * This method should be used to cancel the deletion of the file if it was marked for deletion.
   * @param key - The key of the file to be uploaded e.g. "uploads/file.txt"
   */
  markKeyForNotDeletation(key: string): Promise<void>; //TODO delete after one year
  markKeyForNotDeletion(key: string): Promise<void>;


  /**
   * This method can start needed schedullers, cron jobs, etc. to clean up the storage.
   * @param adapterUserUniqueRepresentation - The unique representation of the plugin instance which 
   * wil use this adapter. Might be handy if you need to distinguish between different instances of the same adapter.
   */
  setupLifecycle(adapterUserUniqueRepresentation: string): Promise<void>;

  /**
   * If adapter is configured to publically, this method should return true.
   */
  objectCanBeAccesedPublicly(): Promise<boolean>;

  /**
   * This method should return the key as a data URL (base64 encoded string).
   * @param key - The key of the file to be converted to a data URL
   * @returns A promise that resolves to a string containing the data URL
   */
  getKeyAsDataURL(key: string): Promise<string>;
}

  