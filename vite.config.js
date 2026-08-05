import { defineConfig } from 'vite';

export default defineConfig({
  // PGlite вантажить власні pglite.wasm і pglite.data у рантаймі. Попереднє
  // бандлення залежностей ці ассети губить, тому пакет виключаємо з
  // optimizeDeps — так рекомендує сам PGlite для Vite.
  optimizeDeps: { exclude: ['@electric-sql/pglite'] },
});
