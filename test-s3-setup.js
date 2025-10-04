// Test script to verify AWS S3 setup
import { S3Client, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Configure AWS S3 Client v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function testS3Setup() {
  try {
    console.log('🔍 Testing AWS S3 setup...');
    
    // Test 1: List buckets
    console.log('\n1. Testing bucket access...');
    const listBucketsCommand = new ListBucketsCommand({});
    const buckets = await s3Client.send(listBucketsCommand);
    console.log('✅ Buckets accessible:', buckets.Buckets.map(b => b.Name));
    
    // Test 2: Check specific bucket
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME not set in environment variables');
    }
    
    console.log(`\n2. Testing bucket: ${bucketName}`);
    const bucketExists = buckets.Buckets.find(b => b.Name === bucketName);
    if (!bucketExists) {
      throw new Error(`Bucket ${bucketName} not found`);
    }
    console.log('✅ Bucket exists');
    
    // Test 3: List objects in bucket
    console.log('\n3. Testing object listing...');
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'mobile-apps/',
      MaxKeys: 5
    });
    const objects = await s3Client.send(listObjectsCommand);
    console.log('✅ Objects in bucket:', objects.Contents.length);
    
    // Test 4: Test upload permissions (small test file)
    console.log('\n4. Testing upload permissions...');
    const testKey = `mobile-apps/test-${Date.now()}.txt`;
    const testContent = 'Test file for S3 setup verification';
    
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    });
    await s3Client.send(putCommand);
    console.log('✅ Upload test successful');
    
    // Test 5: Test delete permissions
    console.log('\n5. Testing delete permissions...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey
    });
    await s3Client.send(deleteCommand);
    console.log('✅ Delete test successful');
    
    console.log('\n🎉 All S3 tests passed! Your setup is ready for large APK uploads.');
    
  } catch (error) {
    console.error('❌ S3 test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check AWS credentials are correct');
    console.log('2. Verify bucket name exists');
    console.log('3. Ensure IAM user has proper permissions');
    console.log('4. Check region is correct');
  }
}

// Run the test
testS3Setup();
