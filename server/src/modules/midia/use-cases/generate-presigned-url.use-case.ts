import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PresignedUrlRequestDTO, PresignedUrlResponseDTO } from '../midia.types';

export class GeneratePresignedUrlUseCase {
  constructor(
    private s3Client: S3Client,
    private bucket: string,
    private publicUrl: string,
  ) {}

  async execute(data: PresignedUrlRequestDTO): Promise<PresignedUrlResponseDTO> {
    const sanitizedName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `media/${randomUUID()}/${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: data.fileType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
    const publicFileUrl = `${this.publicUrl}/${key}`;

    return { uploadUrl, publicUrl: publicFileUrl, key };
  }
}
