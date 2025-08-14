import fs from 'fs';
import path from 'path';

function readPermalinks(filePath) {
  if (!fs.existsSync(filePath)) {
    return new Set();
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  return new Set(
    content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  );
}

function main() {
  const baselineFile = path.join(process.cwd(), 'permalinks-baseline.txt');
  const currentFile = path.join(process.cwd(), 'permalinks.txt');
  
  // Check if this is the first run
  if (!fs.existsSync(baselineFile)) {
    if (fs.existsSync(currentFile)) {
      fs.copyFileSync(currentFile, baselineFile);
      console.log('🆕 Created initial permalink baseline from current build');
      console.log('📝 Please commit permalinks-baseline.txt to your repository');
      return;
    } else {
      console.error('❌ No current permalinks file found. Run 11ty build first.');
      process.exit(1);
    }
  }
  
  const baselinePermalinks = readPermalinks(baselineFile);
  const currentPermalinks = readPermalinks(currentFile);
  
  // Find missing permalinks (existed in baseline but not in current)
  const missingPermalinks = [...baselinePermalinks].filter(
    permalink => !currentPermalinks.has(permalink)
  );
  
  // Find new permalinks (exist in current but not in baseline)
  const newPermalinks = [...currentPermalinks].filter(
    permalink => !baselinePermalinks.has(permalink)
  );
  
  console.log(`📊 Permalink Analysis:`);
  console.log(`   Baseline: ${baselinePermalinks.size} permalinks`);
  console.log(`   Current:  ${currentPermalinks.size} permalinks`);
  
  if (missingPermalinks.length > 0) {
    console.log('\n❌ MISSING PERMALINKS (these URLs will break):');
    missingPermalinks.forEach(permalink => {
      console.log(`   ${permalink}`);
    });
  }
  
  if (newPermalinks.length > 0) {
    console.log('\n🆕 NEW PERMALINKS:');
    newPermalinks.forEach(permalink => {
      console.log(`   ${permalink}`);
    });
    console.log('\n📝 To accept these new permalinks, update your baseline:');
    console.log('   cp permalinks.txt permalinks-baseline.txt');
    console.log('   git add permalinks-baseline.txt');
    console.log('   git commit -m "Update permalink baseline"');
  }
  
  if (missingPermalinks.length === 0 && newPermalinks.length === 0) {
    console.log('\n✅ All permalinks match baseline - no broken links detected');
  }
  
  if (missingPermalinks.length > 0) {
    console.log('\n💡 If permalink changes are intentional:');
    console.log('   1. Add redirects for the missing URLs');
    console.log('   2. Update baseline: cp permalinks.txt permalinks-baseline.txt');
    console.log('   3. Commit the updated baseline');
    
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };