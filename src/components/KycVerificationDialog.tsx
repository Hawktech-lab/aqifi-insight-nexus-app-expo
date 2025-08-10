import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Camera, MapPin, User, Calendar, Phone, AlertCircle, CheckCircle, Clock, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KycVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userSubmission: any;
  onSubmissionUpdate?: () => void;
}

export const KycVerificationDialog: React.FC<KycVerificationDialogProps> = ({
  open,
  onOpenChange,
  userSubmission,
  onSubmissionUpdate,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(!userSubmission || userSubmission.rejection_reason);
  const [formData, setFormData] = useState({
    firstName: userSubmission?.first_name || '',
    lastName: userSubmission?.last_name || '',
    dateOfBirth: userSubmission?.date_of_birth || '',
    address: userSubmission?.address || '',
    city: userSubmission?.city || '',
    country: userSubmission?.country || '',
    postalCode: userSubmission?.postal_code || '',
    phoneNumber: userSubmission?.phone_number || '',
    idDocument: null as File | null,
    addressProof: null as File | null,
    selfie: null as File | null,
  });

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(path, file);
    
    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.idDocument || !formData.addressProof || !formData.selfie) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Upload files
      const timestamp = Date.now();
      const idPath = await uploadFile(formData.idDocument, `${user.id}/id-${timestamp}-${formData.idDocument.name}`);
      const addressPath = await uploadFile(formData.addressProof, `${user.id}/address-${timestamp}-${formData.addressProof.name}`);
      const selfiePath = await uploadFile(formData.selfie, `${user.id}/selfie-${timestamp}-${formData.selfie.name}`);

      // Save or update KYC submission
      const submissionData = {
        user_id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        postal_code: formData.postalCode,
        phone_number: formData.phoneNumber,
        rejection_reason: null,
        reviewed_at: null,
        reviewed_by: null,
      };

      let submissionResult;
      if (userSubmission?.id) {
        // Update existing submission
        submissionResult = await supabase
          .from('kyc_submissions')
          .update(submissionData)
          .eq('id', userSubmission.id);
      } else {
        // Create new submission
        submissionResult = await supabase
          .from('kyc_submissions')
          .insert(submissionData);
      }

      if (submissionResult.error) throw submissionResult.error;

      // Save document records
      const documents = [
        { document_type: 'government_id', file_url: idPath },
        { document_type: 'proof_of_address', file_url: addressPath },
        { document_type: 'selfie', file_url: selfiePath },
      ];

      for (const doc of documents) {
        await supabase
          .from('kyc_documents')
          .insert({
            user_id: user.id,
            document_type: doc.document_type,
            file_url: doc.file_url,
          });
      }

      // Update profile KYC status to pending
      await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('user_id', user.id);

      toast({
        title: "KYC Application Submitted",
        description: "Your application has been submitted and is under review.",
      });

      onOpenChange(false);
      onSubmissionUpdate?.();
      
    } catch (error) {
      console.error('KYC submission error:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      if (userSubmission?.user_id) {
        const { data, error } = await supabase
          .from('kyc_documents')
          .select('*')
          .eq('user_id', userSubmission.user_id);
        
        if (!error && data) {
          setDocuments(data);
        }
      }
    };

    if (open && userSubmission) {
      fetchDocuments();
    }
  }, [open, userSubmission]);

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'government_id':
        return 'Government ID';
      case 'proof_of_address':
        return 'Proof of Address';
      case 'selfie':
        return 'Selfie Verification';
      default:
        return type;
    }
  };

  const downloadDocument = async (fileUrl: string, documentType: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .download(fileUrl);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentType}-${Date.now()}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Failed",
        description: "Could not download the document.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>KYC Verification</DialogTitle>
        </DialogHeader>

        {userSubmission && !showForm ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div>
                <h3 className="font-medium">Current Submission Status</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Submitted: {new Date(userSubmission.created_at).toLocaleDateString()}
                </p>
              </div>
              {getStatusBadge(userSubmission.kyc_status || 'pending')}
            </div>

            {userSubmission.rejection_reason && (
              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-destructive text-sm">Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-destructive/80">{userSubmission.rejection_reason}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    You can submit a new application with corrected documents.
                  </p>
                </CardContent>
              </Card>
            )}

            {!userSubmission.rejection_reason && userSubmission.kyc_status === 'pending' && (
              <Card className="border-warning/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-warning mx-auto mb-4" />
                    <h3 className="font-medium mb-2">Under Review</h3>
                    <p className="text-sm text-muted-foreground">
                      Your KYC application is being reviewed. This process typically takes 1-3 business days.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {userSubmission.kyc_status === 'verified' && (
              <>
                <Card className="border-success/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                      <h3 className="font-medium mb-2">Verification Complete</h3>
                      <p className="text-sm text-muted-foreground">
                        Your identity has been successfully verified.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Submitted Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Full Name:</strong> {userSubmission.first_name} {userSubmission.last_name}
                      </div>
                      <div>
                        <strong>Date of Birth:</strong> {new Date(userSubmission.date_of_birth).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Phone:</strong> {userSubmission.phone_number}
                      </div>
                      <div>
                        <strong>City:</strong> {userSubmission.city}
                      </div>
                      <div>
                        <strong>Country:</strong> {userSubmission.country}
                      </div>
                      <div>
                        <strong>Postal Code:</strong> {userSubmission.postal_code}
                      </div>
                      <div className="md:col-span-2">
                        <strong>Address:</strong> {userSubmission.address}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {documents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Uploaded Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {documents.map((doc) => (
                          <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {getDocumentTypeLabel(doc.document_type)}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadDocument(doc.file_url, doc.document_type)}
                              className="w-full"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              View Document
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {userSubmission.rejection_reason && (
              <div className="pt-4">
                <Button 
                  onClick={() => setShowForm(true)}
                  className="w-full"
                >
                  Submit New Application
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Street Address
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter your street address"
                      rows={2}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Country"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="Postal Code"
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4" />
                        Government ID
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload passport, driver's license, or national ID
                        </p>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
                          className="hidden"
                          id="idDocument"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('idDocument')?.click()}
                        >
                          Choose File
                        </Button>
                        {formData.idDocument && (
                          <p className="text-xs text-success mt-2">{formData.idDocument.name}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4" />
                        Proof of Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload utility bill or bank statement
                        </p>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange('addressProof', e.target.files?.[0] || null)}
                          className="hidden"
                          id="addressProof"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('addressProof')?.click()}
                        >
                          Choose File
                        </Button>
                        {formData.addressProof && (
                          <p className="text-xs text-success mt-2">{formData.addressProof.name}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Camera className="w-4 h-4" />
                        Selfie Photo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload a clear selfie holding your ID
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
                          className="hidden"
                          id="selfie"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('selfie')?.click()}
                        >
                          Choose File
                        </Button>
                        {formData.selfie && (
                          <p className="text-xs text-success mt-2">{formData.selfie.name}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-primary mb-1">Document Requirements</h4>
                        <ul className="text-sm text-primary/80 space-y-1">
                          <li>• All documents must be clear and legible</li>
                          <li>• ID must be government-issued and current</li>
                          <li>• Address proof must be dated within the last 3 months</li>
                          <li>• Selfie should clearly show your face and ID document</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="review" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Application</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Full Name:</strong> {formData.firstName} {formData.lastName}
                      </div>
                      <div>
                        <strong>Date of Birth:</strong> {formData.dateOfBirth}
                      </div>
                      <div>
                        <strong>Phone:</strong> {formData.phoneNumber}
                      </div>
                      <div>
                        <strong>City:</strong> {formData.city}
                      </div>
                      <div>
                        <strong>Country:</strong> {formData.country}
                      </div>
                      <div>
                        <strong>Postal Code:</strong> {formData.postalCode}
                      </div>
                      <div className="md:col-span-2">
                        <strong>Address:</strong> {formData.address}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Uploaded Documents:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {formData.idDocument ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                          Government ID: {formData.idDocument?.name || 'Not uploaded'}
                        </div>
                        <div className="flex items-center gap-2">
                          {formData.addressProof ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                          Proof of Address: {formData.addressProof?.name || 'Not uploaded'}
                        </div>
                        <div className="flex items-center gap-2">
                          {formData.selfie ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                          Selfie Photo: {formData.selfie?.name || 'Not uploaded'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                      <p className="text-sm text-warning-foreground">
                        By submitting this application, you confirm that all information provided is accurate 
                        and that the uploaded documents are genuine. False information may result in account suspension.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.dateOfBirth ||
                  !formData.address ||
                  !formData.city ||
                  !formData.country ||
                  !formData.postalCode ||
                  !formData.phoneNumber ||
                  !formData.idDocument ||
                  !formData.addressProof ||
                  !formData.selfie
                }
                className="flex-1"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};