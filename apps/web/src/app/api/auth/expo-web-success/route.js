import { getToken } from '@auth/core/jwt';

// Escape string for safe inclusion in JavaScript
function escapeForJs(str) {
	if (typeof str !== 'string') return str;
	return str
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/"/g, '\\"')
		.replace(/</g, '\\x3c')
		.replace(/>/g, '\\x3e')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r');
}

// Get allowed origin from environment
function getAllowedOrigin() {
	return process.env.AUTH_URL || 'http://localhost:4000';
}

export async function GET(request) {
	const authSecret = process.env.AUTH_SECRET;
	const authUrl = process.env.AUTH_URL;

	if (!authSecret) {
		console.error('AUTH_SECRET is not configured');
		return new Response('Server configuration error', { status: 500 });
	}

	const [token, jwt] = await Promise.all([
		getToken({
			req: request,
			secret: authSecret,
			secureCookie: authUrl?.startsWith('https') ?? false,
			raw: true,
		}),
		getToken({
			req: request,
			secret: authSecret,
			secureCookie: authUrl?.startsWith('https') ?? false,
		}),
	]);

	const origin = getAllowedOrigin();

	if (!jwt) {
		return new Response(
			`<!DOCTYPE html>
			<html>
				<head><meta charset="utf-8"></head>
				<body>
					<script>
						window.parent.postMessage({ type: 'AUTH_ERROR', error: 'Unauthorized' }, '${escapeForJs(origin)}');
					</script>
				</body>
			</html>`,
			{
				status: 401,
				headers: {
					'Content-Type': 'text/html',
					'X-Content-Type-Options': 'nosniff',
					'X-Frame-Options': 'SAMEORIGIN',
				},
			}
		);
	}

	// Sanitize user data
	const safeMessage = {
		type: 'AUTH_SUCCESS',
		jwt: token,
		user: {
			id: escapeForJs(jwt.sub),
			email: escapeForJs(jwt.email),
			name: escapeForJs(jwt.name),
		},
	};

	return new Response(
		`<!DOCTYPE html>
		<html>
			<head><meta charset="utf-8"></head>
			<body>
				<script>
					window.parent.postMessage(${JSON.stringify(safeMessage)}, '${escapeForJs(origin)}');
				</script>
			</body>
		</html>`,
		{
			headers: {
				'Content-Type': 'text/html',
				'X-Content-Type-Options': 'nosniff',
				'X-Frame-Options': 'SAMEORIGIN',
			},
		}
	);
}
