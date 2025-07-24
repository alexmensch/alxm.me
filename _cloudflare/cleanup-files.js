import { rmSync, existsSync } from 'fs';
import { config } from './config.js';

const { BUILD_AUDIO_DIR } = config;

function cleanupAudioFiles() {
  console.log('🧹 Cleaning up audio files from build...');
  
  if (existsSync(BUILD_AUDIO_DIR)) {
    rmSync(BUILD_AUDIO_DIR, { recursive: true, force: true });
    console.log(`✅ Removed: ${BUILD_AUDIO_DIR}`);
  }
  
  console.log('🎯 Cleanup complete!');
}

cleanupAudioFiles();