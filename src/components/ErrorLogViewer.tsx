import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Platform,
  Modal,
} from 'react-native';
import { errorLogger, ErrorLog } from '../utils/errorLogger';
// Using text-based buttons instead of icons for better compatibility

interface ErrorLogViewerProps {
  visible: boolean;
  onClose: () => void;
}

export const ErrorLogViewer: React.FC<ErrorLogViewerProps> = ({
  visible,
  onClose,
}) => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'debug'>('all');

  useEffect(() => {
    if (visible) {
      loadLogs();
      const unsubscribe = errorLogger.subscribe((updatedLogs) => {
        setLogs(updatedLogs);
      });
      return unsubscribe;
    }
  }, [visible]);

  const loadLogs = () => {
    const allLogs = errorLogger.getLogs();
    setLogs(allLogs);
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter);

  const handleClear = () => {
    // Alert.alert(
    //   'Clear Logs',
    //   'Are you sure you want to clear all error logs?',
    //   [
    //     { text: 'Cancel', style: 'cancel' },
    //     {
    //       text: 'Clear',
    //       style: 'destructive',
    //       onPress: async () => {
    //         await errorLogger.clearLogs();
    //         loadLogs();
    //       },
    //     },
    //   ]
    // );
    // Directly execute the clear action without alert
    (async () => {
      await errorLogger.clearLogs();
      loadLogs();
    })();
  };

  const handleShare = async () => {
    try {
      const logsText = await errorLogger.exportLogs();
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Share.share({
          message: logsText,
          title: 'Error Logs',
        });
      } else {
        // For web/desktop, copy to clipboard
        // Alert.alert('Logs copied to clipboard', logsText);
      }
    } catch (error) {
      // Alert.alert('Error', 'Failed to share logs');
    }
  };

  const getTypeColor = (type: ErrorLog['type']) => {
    switch (type) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      case 'debug':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Error Logs ({filteredLogs.length})</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.filterContainer}>
          {(['all', 'error', 'warning', 'info', 'debug'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setFilter(type)}
              style={[
                styles.filterButton,
                filter === type && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === type && styles.filterButtonTextActive,
                ]}
              >
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={styles.actionButton}>
            <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.logsContainer}>
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No logs found</Text>
          </View>
        ) : (
          filteredLogs
            .slice()
            .reverse()
            .map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: getTypeColor(log.type) },
                    ]}
                  >
                    <Text style={styles.typeBadgeText}>{log.type.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.timestamp}>{formatTimestamp(log.timestamp)}</Text>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
                {log.stack && (
                  <View style={styles.stackContainer}>
                    <Text style={styles.stackLabel}>Stack:</Text>
                    <Text style={styles.stackText}>{log.stack}</Text>
                  </View>
                )}
                {log.context && (
                  <View style={styles.contextContainer}>
                    <Text style={styles.contextLabel}>Context:</Text>
                    <Text style={styles.contextText}>{log.context}</Text>
                  </View>
                )}
              </View>
            ))
        )}
      </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: Platform.OS === 'ios' ? 0 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  closeButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    marginRight: 4,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  logsContainer: {
    flex: 1,
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  logItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#e5e7eb',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 11,
    color: '#6b7280',
  },
  logMessage: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
    fontWeight: '500',
  },
  stackContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  stackLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 4,
  },
  stackText: {
    fontSize: 11,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  contextContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 4,
  },
  contextText: {
    fontSize: 11,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

