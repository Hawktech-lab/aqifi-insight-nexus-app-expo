import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import WaitlistService, { LeaderboardEntry } from '../services/WaitlistService';
import { useWaitlistEnabled } from '../hooks/useWaitlistEnabled';

// Safe errorLogger import - wrap in try-catch to prevent crashes
let errorLogger: any = null;
try {
  const errorLoggerModule = require('../utils/errorLogger');
  errorLogger = errorLoggerModule?.errorLogger || {
    logInfo: () => {},
    logError: () => {},
    logWarning: () => {},
  };
} catch (e) {
  // Fallback logger if import fails
  errorLogger = {
    logInfo: () => {},
    logError: () => {},
    logWarning: () => {},
  };
}

export const Leaderboard: React.FC = () => {
  try {
    errorLogger?.logInfo('[LEADERBOARD] Component rendering');
  } catch (e) {
    // Ignore logging errors
  }
  
  // Hooks must be called unconditionally
  const { user } = useAuth();
  const { enabled: waitlistEnabled = false, loading: enabledLoading = true } = useWaitlistEnabled();
  
  try {
    errorLogger?.logInfo('[LEADERBOARD] Hooks completed', { 
      hasUser: !!user, 
      enabled: waitlistEnabled, 
      loading: enabledLoading 
    });
  } catch (e) {
    // Ignore logging errors
  }
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (waitlistEnabled) {
      loadLeaderboard();
    } else {
      setLoading(false);
    }
  }, [user, waitlistEnabled]);

  const loadLeaderboard = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const waitlistService = WaitlistService?.getInstance?.();
      
      if (!waitlistService) {
        throw new Error('WaitlistService not available');
      }

      const [leaderboardData, rank] = await Promise.all([
        waitlistService.getLeaderboard(100),
        waitlistService.getUserRank(user.id),
      ]);

      setLeaderboard(leaderboardData);
      setUserRank(rank);
    } catch (error) {
      errorLogger?.logError('[LEADERBOARD ERROR] Error loading leaderboard', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#fbbf24';
    if (rank === 2) return '#94a3b8';
    if (rank === 3) return '#f97316';
    return '#6b7280';
  };

  if (enabledLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  if (!waitlistEnabled) {
    return (
      <View style={styles.container}>
        <View style={styles.disabledContainer}>
          <Icon name="lock-closed-outline" size={64} color="#9ca3af" />
          <Text style={styles.disabledTitle}>Leaderboard Unavailable</Text>
          <Text style={styles.disabledText}>
            The waitlist feature is currently disabled. Leaderboard is not available.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Icon name="trophy" size={32} color="#f59e0b" />
        <Text style={styles.headerTitle}>Leaderboard</Text>
        {userRank && (
          <Text style={styles.userRankText}>Your Rank: #{userRank}</Text>
        )}
      </View>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <View style={styles.podium}>
          {/* 2nd Place */}
          <View style={[styles.podiumItem, styles.secondPlace]}>
            <Text style={styles.podiumRank}>2</Text>
            <View style={styles.podiumIcon}>
              <Text style={styles.podiumEmoji}>🥈</Text>
            </View>
            <Text style={styles.podiumPoints}>{leaderboard[1].total_points}</Text>
            <Text style={styles.podiumLabel}>pts</Text>
          </View>

          {/* 1st Place */}
          <View style={[styles.podiumItem, styles.firstPlace]}>
            <Text style={styles.podiumRank}>1</Text>
            <View style={styles.podiumIcon}>
              <Text style={styles.podiumEmoji}>🏆</Text>
            </View>
            <Text style={styles.podiumPoints}>{leaderboard[0].total_points}</Text>
            <Text style={styles.podiumLabel}>pts</Text>
          </View>

          {/* 3rd Place */}
          <View style={[styles.podiumItem, styles.thirdPlace]}>
            <Text style={styles.podiumRank}>3</Text>
            <View style={styles.podiumIcon}>
              <Text style={styles.podiumEmoji}>🥉</Text>
            </View>
            <Text style={styles.podiumPoints}>{leaderboard[2].total_points}</Text>
            <Text style={styles.podiumLabel}>pts</Text>
          </View>
        </View>
      )}

      {/* Leaderboard List */}
      <View style={styles.listContainer}>
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.user_id === user?.id;
          const rankIcon = getRankIcon(entry.rank);
          const rankColor = getRankColor(entry.rank);

          return (
            <View
              key={entry.user_id}
              style={[
                styles.leaderboardItem,
                isCurrentUser && styles.currentUserItem,
              ]}
            >
              <View style={styles.rankContainer}>
                {rankIcon ? (
                  <Text style={styles.rankIcon}>{rankIcon}</Text>
                ) : (
                  <Text style={[styles.rankNumber, { color: rankColor }]}>
                    {entry.rank}
                  </Text>
                )}
              </View>

              <View style={styles.userInfo}>
                <View style={styles.userDetails}>
                  <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                    {isCurrentUser ? 'You' : `User #${entry.user_id.substring(0, 8)}`}
                  </Text>
                  <View style={styles.statsRow}>
                    <Text style={styles.statText}>
                      {entry.referrals_count} referral{entry.referrals_count !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.statSeparator}>•</Text>
                    <Text style={styles.statText}>
                      {entry.social_shares_count} share{entry.social_shares_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.pointsContainer}>
                <Text style={[styles.pointsText, isCurrentUser && styles.currentUserPoints]}>
                  {entry.total_points}
                </Text>
                <Text style={styles.pointsLabel}>pts</Text>
              </View>
            </View>
          );
        })}

        {leaderboard.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="trophy-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No leaderboard data yet</Text>
            <Text style={styles.emptySubtext}>Complete tasks to earn points and climb the ranks!</Text>
          </View>
        )}
      </View>

      {/* Points Breakdown Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How Points Work</Text>
        <View style={styles.infoItem}>
          <Icon name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.infoText}>KYC Completion: 20 points</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="people" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>Each Referral: 5 points</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="share-social" size={20} color="#8b5cf6" />
          <Text style={styles.infoText}>Verified Social Share: 1 point</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  userRankText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 4,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  firstPlace: {
    order: 2,
  },
  secondPlace: {
    order: 1,
  },
  thirdPlace: {
    order: 3,
  },
  podiumRank: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  podiumIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumEmoji: {
    fontSize: 32,
  },
  podiumPoints: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  podiumLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  listContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  currentUserItem: {
    backgroundColor: '#eff6ff',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  rankIcon: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  currentUserName: {
    color: '#3b82f6',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statSeparator: {
    marginHorizontal: 8,
    color: '#9ca3af',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  currentUserPoints: {
    color: '#3b82f6',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 12,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  disabledTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
  },
  disabledText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

