/**
 * Real-time Service
 * WebSocket/Supabase Realtime integration for live updates
 */

import { supabase } from '../lib/database';

type RealtimeClient = unknown;
type RealtimeChannel = any;

interface RealtimeSubscriber {
  event: string;
  callback: (data: any) => void;
}

class RealtimeService {
  private client: RealtimeClient | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscribers: Map<string, RealtimeSubscriber[]> = new Map();
  private isConnected = false;

  /**
   * Initialize Realtime connection
   */
  async initialize(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session for realtime connection');
        return;
      }

      // Use Supabase Realtime
      console.log('Realtime connection initialized');
      this.isConnected = true;
    } catch (err) {
      console.error('Realtime initialization error:', err);
    }
  }

  /**
   * Subscribe to code submissions for a user (live judge results)
   */
  subscribeToSubmissions(userId: string, callback: (submission: any) => void): void {
    const channel = supabase
      .channel(`submissions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'code_submissions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`Submissions subscription status: ${status}`);
      });

    this.channels.set(`submissions:${userId}`, channel);
  }

  /**
   * Subscribe to live leaderboard updates
   */
  subscribeToLeaderboard(contestId: string, callback: (entry: any) => void): void {
    const channel = supabase
      .channel(`leaderboard:${contestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leaderboard_snapshots',
          filter: `contest_id=eq.${contestId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`Leaderboard subscription status: ${status}`);
      });

    this.channels.set(`leaderboard:${contestId}`, channel);
  }

  /**
   * Subscribe to contest updates (starts, ends, problems change)
   */
  subscribeToContest(contestId: string, callback: (contest: any) => void): void {
    const channel = supabase
      .channel(`contest:${contestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contests',
          filter: `id=eq.${contestId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`Contest subscription status: ${status}`);
      });

    this.channels.set(`contest:${contestId}`, channel);
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(userId: string, callback: (notification: any) => void): void {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`Notifications subscription status: ${status}`);
      });

    this.channels.set(`notifications:${userId}`, channel);
  }

  /**
   * Subscribe to discussion updates
   */
  subscribeToDiscussion(discussionId: string, callback: (reply: any) => void): void {
    const channel = supabase
      .channel(`discussion:${discussionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion_replies',
          filter: `discussion_id=eq.${discussionId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`Discussion subscription status: ${status}`);
      });

    this.channels.set(`discussion:${discussionId}`, channel);
  }

  /**
   * Subscribe to user achievements
   */
  subscribeToAchievements(userId: string, callback: (achievement: any) => void): void {
    const channel = supabase
      .channel(`achievements:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`Achievements subscription status: ${status}`);
      });

    this.channels.set(`achievements:${userId}`, channel);
  }

  /**
   * Subscribe to friend requests
   */
  subscribeToFriendRequests(userId: string, callback: (request: any) => void): void {
    const channel = supabase
      .channel(`friend_requests:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`Friend requests subscription status: ${status}`);
      });

    this.channels.set(`friend_requests:${userId}`, channel);
  }

  /**
   * Broadcast typing indicator in discussion
   */
  broadcastTyping(discussionId: string, userId: string, userName: string): void {
    const channel = supabase.channel(`discussion:${discussionId}`);

    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        userName,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Receive typing indicators
   */
  onTyping(discussionId: string, callback: (data: any) => void): void {
    const channel = supabase
      .channel(`discussion:${discussionId}`)
      .on(
        'broadcast',
        {
          event: 'typing',
        },
        (payload) => {
          callback(payload.payload);
        }
      )
      .subscribe();

    this.channels.set(`discussion:${discussionId}:typing`, channel);
  }

  /**
   * Broadcast cursor position for pair programming
   */
  broadcastCursor(sessionId: string, userId: string, line: number, column: number): void {
    const channel = supabase.channel(`pair:${sessionId}`);

    channel.send({
      type: 'broadcast',
      event: 'cursor_move',
      payload: {
        userId,
        line,
        column,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Receive cursor updates
   */
  onCursorMove(sessionId: string, callback: (data: any) => void): void {
    const channel = supabase
      .channel(`pair:${sessionId}`)
      .on(
        'broadcast',
        {
          event: 'cursor_move',
        },
        (payload) => {
          callback(payload.payload);
        }
      )
      .subscribe();

    this.channels.set(`pair:${sessionId}:cursor`, channel);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelKey: string): void {
    const channel = this.channels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelKey);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    activeChannels: number;
  } {
    return {
      connected: this.isConnected,
      activeChannels: this.channels.size,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.unsubscribeAll();
    this.isConnected = false;
  }
}

// Export singleton
export const realtimeService = new RealtimeService();
export default realtimeService;
