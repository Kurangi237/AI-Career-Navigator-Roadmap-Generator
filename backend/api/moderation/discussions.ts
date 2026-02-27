/**
 * Discussion Moderation API
 * Endpoints for flagging, approving, deleting discussion content
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/database';

const router = Router();

/**
 * Flag a discussion or comment as inappropriate
 * POST /api/moderation/flag
 */
router.post('/flag', async (req: Request, res: Response) => {
  try {
    const { discussionId, reason, description, contentType } = req.body;
    const userId = req.user?.id;

    if (!userId || !discussionId || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if already flagged
    const { data: existing, error: checkError } = await supabase
      .from('discussion_flags')
      .select('id')
      .eq('discussion_id', discussionId)
      .eq('flagged_by', userId)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Already flagged by this user' });
    }

    // Insert flag
    const { data, error } = await supabase
      .from('discussion_flags')
      .insert([
        {
          discussion_id: discussionId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          reason,
          description,
          flagged_by: userId,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ flagged: true, id: data.id });
  } catch (err) {
    console.error('Flag error:', err);
    res.status(500).json({ error: 'Failed to flag content' });
  }
});

/**
 * Approve/reject a flagged discussion
 * POST /api/moderation/:flagId/resolve
 */
router.post('/:flagId/resolve', async (req: Request, res: Response) => {
  try {
    const { flagId } = req.params;
    const { action, notes } = req.body;
    const adminId = req.user?.id;

    if (!['approve', 'reject', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      delete: 'deleted',
    };

    // Update flag
    const { data: flag, error: fetchError } = await supabase
      .from('discussion_flags')
      .select('discussion_id')
      .eq('id', flagId)
      .single();

    if (fetchError) throw fetchError;

    // If deleting, hide/delete the discussion
    if (action === 'delete') {
      await supabase
        .from('discussions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', flag.discussion_id);
    }

    // Update flag resolution
    const { error: updateError } = await supabase
      .from('discussion_flags')
      .update({
        status: statusMap[action as keyof typeof statusMap],
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
      })
      .eq('id', flagId);

    if (updateError) throw updateError;

    res.json({ resolved: true });
  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).json({ error: 'Failed to resolve flag' });
  }
});

/**
 * Get discussion flags (admin only)
 * GET /api/moderation/flags?status=pending&limit=50
 */
router.get('/flags', async (req: Request, res: Response) => {
  try {
    const { status = 'pending', limit = 50 } = req.query;

    let query = supabase
      .from('discussion_flags')
      .select('*')
      .order('flagged_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ flags: data });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch flags' });
  }
});

/**
 * Warn a user about inappropriate content
 * POST /api/moderation/warn-user
 */
router.post('/warn-user', async (req: Request, res: Response) => {
  try {
    const { userId, reason, message } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Record violation
    const { error } = await supabase
      .from('user_violations')
      .insert([
        {
          user_id: userId,
          violation_type: 'content_warning',
          reason,
          severity: 'low',
          timestamp: new Date().toISOString(),
        },
      ]);

    if (error) throw error;

    // Send notification (placeholder)
    console.log(`Warning sent to user ${userId}: ${message}`);

    res.json({ warned: true });
  } catch (err) {
    console.error('Warning error:', err);
    res.status(500).json({ error: 'Failed to warn user' });
  }
});

/**
 * Get moderation statistics
 * GET /api/moderation/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pending flags
    const { data: pending, error: pendingError } = await supabase
      .from('discussion_flags')
      .select('id')
      .eq('status', 'pending');

    // Today's flags
    const { data: todaysFlags, error: todayError } = await supabase
      .from('discussion_flags')
      .select('id')
      .gte('flagged_at', today.toISOString());

    // Today's approvals
    const { data: approved, error: approvedError } = await supabase
      .from('discussion_flags')
      .select('id')
      .eq('status', 'approved')
      .gte('resolved_at', today.toISOString());

    if (pendingError || todayError || approvedError) throw pendingError;

    res.json({
      stats: {
        pendingFlags: pending?.length || 0,
        todaysFlags: todaysFlags?.length || 0,
        approvedToday: approved?.length || 0,
        averageResolutionTime: 120, // placeholder
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
