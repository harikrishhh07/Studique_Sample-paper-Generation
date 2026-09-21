import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
	outputFileTracingRoot: __dirname,
	reactStrictMode: true,
	env: {
		GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
		GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
	},
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'images.unsplash.com' },
			{ protocol: 'https', hostname: 'i.ytimg.com' },
			{ protocol: 'https', hostname: 'img.youtube.com' },
			{ protocol: 'https', hostname: 'avatars.githubusercontent.com' },
			{ protocol: 'https', hostname: 'avatars0.githubusercontent.com' },
			{ protocol: 'https', hostname: 'avatars1.githubusercontent.com' },
			{ protocol: 'https', hostname: 'secure.gravatar.com' },
			{ protocol: 'https', hostname: 'lh3.googleusercontent.com' },
			{ protocol: 'https', hostname: 'pbs.twimg.com' },
			{ protocol: 'https', hostname: 'githubusercontent.com' },
			{ protocol: 'https', hostname: 'via.placeholder.com' },
		],
	},
	async headers() {
		return [
			{
				source: '/.well-known/apple-app-site-association',
				headers: [
					{ key: 'Content-Type', value: 'application/json' },
					{ key: 'Cache-Control', value: 'public, max-age=86400' }
				]
			},
			{
				source: '/_next/static/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
				]
			},
			{
				source: '/static/:path*',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
				]
			},
			{
				source: '/:all*\\.(js|css|png|jpg|jpeg|svg|gif|webp|ico)',
				headers: [
					{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' }
				]
			}
		];
	},
	compress: true,
	modularizeImports: {
		'@radix-ui/react-icons': {
			transform: '@radix-ui/react-icons/dist/{{member}}'
		},
		'react-icons': {
			transform: 'react-icons/{{member}}'
		}
	},
	compiler: {
		removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false
	},
	experimental: {
		optimizeCss: false, // Disabled optimizeCss to prevent critters build/runtime crash
		optimizePackageImports: ['@radix-ui/react-icons', 'react-icons', 'lucide-react', 'framer-motion'],
	},
	productionBrowserSourceMaps: false,
	poweredByHeader: false,
}

export default nextConfig