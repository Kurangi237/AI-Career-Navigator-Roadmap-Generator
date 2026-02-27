/**
 * Collaboration Service
 * Real-time code collaboration with cursor tracking and document synchronization
 */

import { supabase } from '../lib/database';

interface CollaborationSession {
  id: string;
  problemId: string;
  initiatorId: string;
  inviteeId: string;
  code: string;
  language: string;
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

interface CursorPosition {
  userId: string;
  userName: string;
  line: number;
  column: number;
  timestamp: number;
}

class CollaborationService {
  private sessions: Map<string, CollaborationSession> = new Map();
  private cursorPositions: Map<string, CursorPosition[]> = new Map();
  private onSessionChangeCallback: ((session: CollaborationSession) => void) | null = null;
  private onCursorChangeCallback: ((cursor: CursorPosition) => void) | null = null;

  /**
   * Create a new collaboration session (invite another user)
   */
  async createSession(
    problemId: string,
    initiatorId: string,
    inviteeId: string
  ): Promise<CollaborationSession> {
    try {
      // Create session record
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .insert([
          {
            problem_id: problemId,
            initiator_id: initiatorId,
            invitee_id: inviteeId,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const session: CollaborationSession = {
        id: data.id,
        problemId: data.problem_id,
        initiatorId: data.initiator_id,
        inviteeId: data.invitee_id,
        code: '',
        language: 'javascript',
        status: data.status,
        createdAt: data.created_at,
      };

      this.sessions.set(session.id, session);

      // Send notification to invitee
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: inviteeId,
            type: 'pair_programming_invite',
            title: 'Pair Programming Invitation',
            message: `User invited you to pair program on a problem`,
            related_entity_id: problemId,
            related_entity_type: 'problem',
          },
        ]);

      this.onSessionChangeCallback?.(session);
      return session;
    } catch (err) {
      console.error('Create session error:', err);
      throw err;
    }
  }

  /**
   * Accept collaboration invitation
   */
  async acceptSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('collaboration_sessions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      const session = this.sessions.get(sessionId);
      if (session) {
        session.status = 'active';
        session.startedAt = new Date().toISOString();
        this.onSessionChangeCallback?.(session);
      }
    } catch (err) {
      console.error('Accept session error:', err);
      throw err;
    }
  }

  /**
   * Decline collaboration invitation
   */
  async declineSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('collaboration_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      this.sessions.delete(sessionId);
    } catch (err) {
      console.error('Decline session error:', err);
      throw err;
    }
  }

  /**
   * Update shared code in session
   */
  async updateCode(
    sessionId: string,
    code: string,
    language: string,
    userId: string
  ): Promise<void> {
    try {
      // Store code update in database
      const { error: updateError } = await supabase
        .from('collaboration_sessions')
        .update({
          code,
          language,
          last_modified_by: userId,
          last_modified_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Also store in code_snapshots for history
      await supabase
        .from('collaboration_code_snapshots')
        .insert([
          {
            session_id: sessionId,
            user_id: userId,
            code,
            language,
          },
        ]);

      const session = this.sessions.get(sessionId);
      if (session) {
        session.code = code;
        session.language = language;
        this.onSessionChangeCallback?.(session);
      }
    } catch (err) {
      console.error('Update code error:', err);
    }
  }

  /**
   * Broadcast cursor position to collaborate
   */
  broadcastCursor(
    sessionId: string,
    userId: string,
    userName: string,
    line: number,
    column: number
  ): void {
    const cursor: CursorPosition = {
      userId,
      userName,
      line,
      column,
      timestamp: Date.now(),
    };

    if (!this.cursorPositions.has(sessionId)) {
      this.cursorPositions.set(sessionId, []);
    }

    const positions = this.cursorPositions.get(sessionId)!;

    // Update or add cursor position
    const existingIdx = positions.findIndex((p) => p.userId === userId);
    if (existingIdx >= 0) {
      positions[existingIdx] = cursor;
    } else {
      positions.push(cursor);
    }

    // Keep only last 100 cursor positions per session
    if (positions.length > 100) {
      positions.shift();
    }

    this.onCursorChangeCallback?.(cursor);
  }

  /**
   * Get cursor positions for a session
   */
  getCursorPositions(sessionId: string): CursorPosition[] {
    return this.cursorPositions.get(sessionId) || [];
  }

  /**
   * End collaboration session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('collaboration_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      const session = this.sessions.get(sessionId);
      if (session) {
        session.status = 'completed';
        session.endedAt = new Date().toISOString();
        this.onSessionChangeCallback?.(session);
      }

      // Clear cursor positions
      this.cursorPositions.delete(sessionId);
    } catch (err) {
      console.error('End session error:', err);
      throw err;
    }
  }

  /**
   * Get user's active collaboration sessions
   */
  async getActiveSessions(userId: string): Promise<CollaborationSession[]> {
    try {
      // Get pending invitations
      const { data: pendingInvites, error: pendingError } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .eq('invitee_id', userId)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Get active sessions
      const { data: activeSessions, error: activeError } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .or(`initiator_id.eq.${userId},invitee_id.eq.${userId}`)
        .eq('status', 'active');

      if (activeError) throw activeError;

      const allSessions = [...(pendingInvites || []), ...(activeSessions || [])].map(
        (s: any) => ({
          id: s.id,
          problemId: s.problem_id,
          initiatorId: s.initiator_id,
          inviteeId: s.invitee_id,
          code: s.code || '',
          language: s.language || 'javascript',
          status: s.status,
          createdAt: s.created_at,
          startedAt: s.started_at,
          endedAt: s.ended_at,
        })
      );

      // Cache sessions
      allSessions.forEach((session) => {
        this.sessions.set(session.id, session);
      });

      return allSessions;
    } catch (err) {
      console.error('Get sessions error:', err);
      return [];
    }
  }

  /**
   * Export collaboration session (download code)
   */
  async exportSession(sessionId: string, format: 'txt' | 'json' = 'txt'): Promise<string> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');

      if (format === 'json') {
        return JSON.stringify(
          {
            problemId: session.problemId,
            language: session.language,
            code: session.code,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        );
      } else {
        // Plain text format
        return session.code;
      }
    } catch (err) {
      console.error('Export session error:', err);
      throw err;
    }
  }

  /**
   * Register callbacks for session/cursor changes
   */
  onSessionChange(callback: (session: CollaborationSession) => void): void {
    this.onSessionChangeCallback = callback;
  }

  onCursorChange(callback: (cursor: CursorPosition) => void): void {
    this.onCursorChangeCallback = callback;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.sessions.clear();
    this.cursorPositions.clear();
    this.onSessionChangeCallback = null;
    this.onCursorChangeCallback = null;
  }
}

export const collaborationService = new CollaborationService();
export default collaborationService;
