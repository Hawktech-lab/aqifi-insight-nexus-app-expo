import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface FileData {
  uri: string;
  name: string;
  type: string;
}

interface KYCFormProps {
  onSubmissionComplete?: () => void;
  isResubmission?: boolean;
}

export function KYCForm({ onSubmissionComplete, isResubmission = false }: KYCFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    phoneNumber: '',
    city: '',
    country: '',
    postalCode: ''
  });
  const [files, setFiles] = useState<{
    idFront: FileData | null;
    idBack: FileData | null;
    selfie: FileData | null;
    addressProof: FileData | null;
  }>({
    idFront: null,
    idBack: null,
    selfie: null,
    addressProof: null
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showImagePicker = (type: keyof typeof files, allowDocuments = false) => {
    Alert.alert(
      'Select Document',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera(type) },
        { text: 'Gallery', onPress: () => openGallery(type) },
        ...(allowDocuments ? [{ text: 'Documents', onPress: () => openDocumentPicker(type) }] : []),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = (type: keyof typeof files) => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) return;
        
        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          setFiles(prev => ({
            ...prev,
            [type]: {
              uri: asset.uri!,
              name: asset.fileName || `${type}_${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg'
            }
          }));
        }
      }
    );
  };

  const openGallery = (type: keyof typeof files) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) return;
        
        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          setFiles(prev => ({
            ...prev,
            [type]: {
              uri: asset.uri!,
              name: asset.fileName || `${type}_${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg'
            }
          }));
        }
      }
    );
  };

  const openDocumentPicker = async (type: keyof typeof files) => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
      });
      
      setFiles(prev => ({
        ...prev,
        [type]: {
          uri: result.uri,
          name: result.name,
          type: result.type || 'application/octet-stream'
        }
      }));
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  const uploadFile = async (file: FileData, fileName: string) => {
    // Convert file to blob for upload
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(`${user!.id}/${fileName}`, blob);
    
    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'address', 'phoneNumber', 'city', 'country', 'postalCode'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        Alert.alert('Validation Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    // Validate required files
    const requiredFiles = ['idFront', 'idBack', 'selfie', 'addressProof'];
    for (const fileType of requiredFiles) {
      if (!files[fileType as keyof typeof files]) {
        Alert.alert('Validation Error', `Please upload ${fileType.replace(/([A-Z])/g, ' $1').toLowerCase()} document`);
        return;
      }
    }

    setLoading(true);
    try {
      // Upload all files
      const uploadPromises = Object.entries(files).map(async ([type, file]) => {
        if (!file) throw new Error(`Please upload ${type} document`);
        const fileName = `${type}_${Date.now()}.${file.name.split('.').pop()}`;
        const path = await uploadFile(file, fileName);
        return { type: type.replace(/([A-Z])/g, '_$1').toLowerCase(), path };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      if (isResubmission) {
        // For resubmissions, update existing submission
        const { error: submissionError } = await supabase
          .from('kyc_submissions')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            date_of_birth: formData.dateOfBirth,
            address: formData.address,
            phone_number: formData.phoneNumber,
            city: formData.city,
            country: formData.country,
            postal_code: formData.postalCode,
            rejection_reason: null,
            reviewed_at: null,
            reviewed_by: null
          })
          .eq('user_id', user.id);

        if (submissionError) throw submissionError;

        // Delete old documents
        const { error: deleteDocsError } = await supabase
          .from('kyc_documents')
          .delete()
          .eq('user_id', user.id);

        if (deleteDocsError) throw deleteDocsError;
      } else {
        // For new submissions, insert new submission
        const { error: submissionError } = await supabase
          .from('kyc_submissions')
          .insert({
            user_id: user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            date_of_birth: formData.dateOfBirth,
            address: formData.address,
            phone_number: formData.phoneNumber,
            city: formData.city,
            country: formData.country,
            postal_code: formData.postalCode
          });

        if (submissionError) throw submissionError;
      }

      // Insert new document records
      const documentInserts = uploadedFiles.map(({ type, path }) => ({
        user_id: user.id,
        document_type: type,
        file_url: path
      }));

      const { error: documentsError } = await supabase
        .from('kyc_documents')
        .insert(documentInserts);

      if (documentsError) throw documentsError;

      // Update profile KYC status to pending
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      Alert.alert(
        isResubmission ? "KYC Resubmitted" : "KYC Submitted",
        isResubmission 
          ? "Your KYC verification has been resubmitted and is under review." 
          : "Your KYC verification has been submitted and is under review."
      );

      onSubmissionComplete?.();

    } catch (error: any) {
      Alert.alert("Submission Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const FileUploadButton = ({ 
    type, 
    label,
    allowDocuments = false
  }: { 
    type: keyof typeof files; 
    label: string;
    allowDocuments?: boolean;
  }) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-800 mb-1.5">{label}</Text>
      <TouchableOpacity 
        className="border border-blue-500 rounded-lg p-3 items-center bg-blue-50"
        onPress={() => showImagePicker(type, allowDocuments)}
      >
        <Text className="text-blue-500 text-base font-medium">
          {files[type] ? 'Change File' : 'Select File'}
        </Text>
      </TouchableOpacity>
      {files[type] && (
        <View className="mt-2 p-2 bg-gray-100 rounded-md">
          <Text className="text-xs text-gray-600 mb-2">{files[type]!.name}</Text>
          {files[type]!.type.startsWith('image/') && (
            <Image source={{ uri: files[type]!.uri }} className="w-15 h-15 rounded" />
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-100" showsVerticalScrollIndicator={false}>
      <View className="bg-white m-4 rounded-xl p-5 shadow-sm">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">KYC Verification</Text>
          <Text className="text-base text-gray-600">
            Complete your identity verification to unlock all features
          </Text>
        </View>

        <View className="gap-4">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-800 mb-1.5">First Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base bg-white"
                value={formData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
                placeholder="Enter first name"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-800 mb-1.5">Last Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base bg-white"
                value={formData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
                placeholder="Enter last name"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-800 mb-1.5">Date of Birth</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-base bg-white"
              value={formData.dateOfBirth}
              onChangeText={(text) => handleInputChange('dateOfBirth', text)}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-800 mb-1.5">Address</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-base bg-white h-20"
              style={{ textAlignVertical: 'top' }}
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder="Enter your address"
              multiline
              numberOfLines={3}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-800 mb-1.5">Phone Number</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-base bg-white"
              value={formData.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-800 mb-1.5">City</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base bg-white"
                value={formData.city}
                onChangeText={(text) => handleInputChange('city', text)}
                placeholder="City"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-800 mb-1.5">Country</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base bg-white"
                value={formData.country}
                onChangeText={(text) => handleInputChange('country', text)}
                placeholder="Country"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-800 mb-1.5">Postal Code</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base bg-white"
                value={formData.postalCode}
                onChangeText={(text) => handleInputChange('postalCode', text)}
                placeholder="Postal Code"
              />
            </View>
          </View>

          <View className="mt-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4">Required Documents</Text>
            <View className="gap-4">
              <FileUploadButton type="idFront" label="ID Front" />
              <FileUploadButton type="idBack" label="ID Back" />
              <FileUploadButton type="selfie" label="Selfie" />
              <FileUploadButton type="addressProof" label="Address Proof" allowDocuments />
            </View>
          </View>

          <TouchableOpacity
            className={`rounded-lg p-4 items-center mt-6 ${
              loading ? 'bg-gray-400' : 'bg-blue-500'
            }`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-semibold">Submit KYC Verification</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
