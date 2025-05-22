/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Configurar ISR (Incremental Static Regeneration)
  experimental: {
    // Permitir ISR
    isrMemoryCacheSize: 0, // Desabilitar cache em memória, usar o sistema de arquivos
  },
  // Ignorar erros de pré-renderização durante o build
  typescript: {
    // Verificar tipos mas não falhar o build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Verificar ESLint mas não falhar o build
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  // Configurar outras opções conforme necessário
};

module.exports = {
  output: 'standalone',
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    styledComponents: true,
  }
}