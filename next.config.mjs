/** @type {import('next').NextConfig} */
// Note : pas d'en-têtes COOP/COEP — le cœur ffmpeg.wasm single-thread
// (auto-hébergé dans /public/ffmpeg) n'a pas besoin de SharedArrayBuffer,
// et COEP bloquerait le chargement du worker.
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
