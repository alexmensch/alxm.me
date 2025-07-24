import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { BUCKET_NAME, AUDIO_DIR, WORKER_NAME, DOMAIN } = config;

async function checkFileInR2(key) {
  try {
    const result = execSync(
      `cd _cloudflare && npx wrangler r2 object get ${BUCKET_NAME}/${key} --file /dev/null --json 2>/dev/null`, 
      { encoding: 'utf8' }
    );
    const objectInfo = JSON.parse(result);
    return objectInfo.etag?.replace(/"/g, '');
  } catch (error) {
    return null;
  }
}

async function fileExistsInR2(filePath, key) {
  try {
    const r2ETag = await checkFileInR2(key);
    
    if (!r2ETag) {
      return false;
    }
    
    const fileContent = readFileSync(filePath);
    const localMD5 = createHash('md5').update(fileContent).digest('hex');
    
    if (localMD5 === r2ETag) {
      return true;
    } else {
      console.log(`🔄 File ${key} exists but content differs - will update`);
      return false;
    }
    
  } catch (error) {
    console.error(`Error checking file ${key}:`, error);
    return false;
  }
}

async function uploadFileToR2(filePath, key) {
  try {
    execSync(
      `cd _cloudflare && npx wrangler r2 object put ${BUCKET_NAME}/${key} --file "../${filePath}" --content-type "audio/mpeg"`, 
      { stdio: 'inherit' }
    );
    console.log(`✅ Uploaded: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${key}:`, error);
    throw error;
  }
}

async function generateConfigFiles() {
  try {
    console.log('📝 Generating config files from templates...');
    
    const audioWebPath = '/' + AUDIO_DIR.replace('src/', '') + '/';
    
    // Generate worker.js from template
    const workerTemplate = readFileSync(join(__dirname, 'worker.template.js'), 'utf8');
    const workerScript = workerTemplate.replace(/{{AUDIO_PATH}}/g, audioWebPath);
    writeFileSync(join(__dirname, 'worker.js'), workerScript);
    
    // Generate wrangler.toml from template
    const wranglerTemplate = readFileSync(join(__dirname, 'wrangler.template.toml'), 'utf8');
    const wranglerConfig = wranglerTemplate
      .replace(/{{WORKER_NAME}}/g, WORKER_NAME)
      .replace(/{{BUCKET_NAME}}/g, BUCKET_NAME)
      .replace(/{{AUDIO_PATH}}/g, audioWebPath);
    writeFileSync(join(__dirname, 'wrangler.toml'), wranglerConfig);
    
    console.log('✅ Config files generated');
    
  } catch (error) {
    console.error('❌ Config generation failed:', error);
    process.exit(1);
  }
}

async function deployWorker() {
  try {
    console.log('🚀 Deploying worker...');
    execSync('cd _cloudflare && npx wrangler deploy ./worker.js', { stdio: 'inherit' });
    console.log('✅ Worker deployed successfully');
  } catch (error) {
    console.error('❌ Worker deployment failed:', error);
    process.exit(1);
  }
}

async function setupWorkerRoute() {
  try {
    console.log('🔗 Setting up worker route...');
    
    const audioWebPath = '/' + AUDIO_DIR.replace('src/', '') + '/*';
    const routePattern = `${DOMAIN}${audioWebPath}`;
    
    execSync(`cd _cloudflare && npx wrangler route add "${routePattern}" --name ${WORKER_NAME}`, 
      { stdio: 'inherit' });
    
    console.log(`✅ Route configured: ${routePattern}`);
    
  } catch (error) {
    console.warn('⚠️  Route setup failed (may already exist):', error.message);
  }
}

async function syncAudioFiles() {
  try {
    const files = readdirSync(AUDIO_DIR);
    const mp3Files = files.filter(file => file.endsWith('.mp3'));

    console.log(`🎵 Found ${mp3Files.length} MP3 files to sync...`);

    for (const file of mp3Files) {
      const filePath = join(AUDIO_DIR, file);
      const key = file;
      
      const isSameFile = await fileExistsInR2(filePath, key);
      
      if (isSameFile) {
        console.log(`⏭️  Skipped (identical): ${key}`);
      } else {
        await uploadFileToR2(filePath, key);
      }
    }

    console.log('🚀 R2 sync complete!');
    
    await generateConfigFiles();
    await deployWorker();
    await setupWorkerRoute();
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncAudioFiles();