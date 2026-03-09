import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

interface ThirdPartyConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  thirdPartyName?: string;
}

export const ThirdPartyConfirmationModal: React.FC<ThirdPartyConfirmationModalProps> = ({
  visible,
  onConfirm,
  onDecline,
  thirdPartyName = 'zkMe',
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <AlertTriangle size={24} color="#f59e0b" style={styles.icon} />
            <Text style={styles.title}>Third-Party Service Notice</Text>
          </View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <Text style={styles.description}>
              You are about to use a third-party service ({thirdPartyName}) for KYC (Know Your Customer) verification.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Important Information:</Text>
              <Text style={styles.bulletPoint}>
                • This service is provided by an external third-party provider
              </Text>
              <Text style={styles.bulletPoint}>
                • Your personal information may be processed by {thirdPartyName}
              </Text>
              <Text style={styles.bulletPoint}>
                • Please review {thirdPartyName}'s privacy policy and terms of service
              </Text>
              <Text style={styles.bulletPoint}>
                • We are not responsible for the third-party's data handling practices
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What happens next:</Text>
              <Text style={styles.bulletPoint}>
                • You will be redirected to {thirdPartyName}'s verification platform
              </Text>
              <Text style={styles.bulletPoint}>
                • Follow their instructions to complete the verification process
              </Text>
              <Text style={styles.bulletPoint}>
                • Your verification status will be updated in our system upon completion
              </Text>
            </View>

            <Text style={styles.footerText}>
              By proceeding, you acknowledge that you have read and understood this notice.
            </Text>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={onDecline}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    height: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  declineButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

