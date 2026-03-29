import { defineConfig } from 'vite';
import { execSync } from 'child_process';

// Gitタグを取得（取得できない場合は package.json のバージョンをフォールバック）
let appVersion = '1.0.0';
try {
  appVersion = execSync('git describe --tags --abbrev=0').toString().trim();
} catch (e) {
  console.warn('Git tag not found, using fallback version');
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  base: './', // GitHub Pages用
});
