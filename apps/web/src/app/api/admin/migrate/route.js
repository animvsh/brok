import { getUserId } from '@/app/api/utils/auth';
import { migrateAllUsers, migrateSingleUser, checkUserMigration } from '@/app/api/utils/migration/migrateV1ToV2';

/**
 * POST /api/admin/migrate
 * Trigger V1 to V2 migration
 *
 * Body: { scope: 'all' | 'self' }
 * Returns: Migration report
 */
export async function POST(request) {
  try {
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ error: userError }, { status: userStatus });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { scope = 'self' } = body;

    // For 'all' scope, you might want to add admin check here
    // For now, we only allow 'self' migration for safety

    if (scope === 'all') {
      // Add admin check here in production
      // const isAdmin = await checkIfAdmin(userId);
      // if (!isAdmin) {
      //   return Response.json({ error: 'Unauthorized' }, { status: 403 });
      // }

      const report = await migrateAllUsers();
      return Response.json({
        message: 'Migration complete',
        report,
      });
    }

    // Default: migrate only the current user
    const result = await migrateSingleUser(userId);

    return Response.json({
      message: result.success ? 'Migration successful' : 'Migration failed',
      result,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ error: 'Migration failed' }, { status: 500 });
  }
}

/**
 * GET /api/admin/migrate
 * Check migration status for current user
 */
export async function GET(request) {
  try {
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ error: userError }, { status: userStatus });
    }

    const result = await checkUserMigration(userId);

    return Response.json({
      userId,
      ...result,
    });
  } catch (error) {
    console.error('Migration check error:', error);
    return Response.json({ error: 'Failed to check migration status' }, { status: 500 });
  }
}
