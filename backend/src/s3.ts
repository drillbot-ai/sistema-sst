import AWS from 'aws-sdk';

// Initialize the S3 client using environment variables. Ensure that
// AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION and AWS_S3_BUCKET are
// defined in your .env file. Without valid credentials the calls will fail.
const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;

if (!region || !bucket) {
  console.warn('AWS S3 not fully configured: Missing AWS_REGION or AWS_S3_BUCKET');
}

const s3 = new AWS.S3({
  region,
  signatureVersion: 'v4',
});

// Generate a pre-signed URL for uploading files. The key should be a unique
// identifier (e.g. UUID or timestamp) and contentType the MIME type of the
// file (e.g. application/pdf). The URL expires in 5 minutes by default.
export async function getPresignedUploadUrl(key: string, contentType: string, expiresInSeconds = 300) {
  if (!bucket) throw new Error('Missing AWS_S3_BUCKET');
  const params = {
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    Expires: expiresInSeconds,
  };
  const url = await s3.getSignedUrlPromise('putObject', params);
  return { url, key };
}