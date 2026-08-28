'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  MapPin, 
  Lock, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  AlertCircle, 
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: 'Other',
    nationality: 'Sri Lankan',
    address: '',
    district: 'Colombo',
    province: 'Western',
    city: 'Colombo',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    nicNumber: '',
  });

  // NIC Files & Previews
  const [nicFrontFile, setNicFrontFile] = useState(null);
  const [nicBackFile, setNicBackFile] = useState(null);
  const [nicFrontPreview, setNicFrontPreview] = useState(null);
  const [nicBackPreview, setNicBackPreview] = useState(null);

  const districts = [
    'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 
    'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 
    'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Moneragala', 
    'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 
    'Trincomalee', 'Vavuniya'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(null);
  };

  // Image Upload Validator
  const handleFileUpload = (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Allowed Mime Types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg(`Invalid file format for ${docType}. Only JPEG, PNG, and WEBP images are allowed.`);
      return;
    }

    // Max Size: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg(`File size for ${docType} exceeds 5MB limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (docType === 'NIC Front') {
        setNicFrontFile(file);
        setNicFrontPreview(reader.result);
      } else {
        setNicBackFile(file);
        setNicBackPreview(reader.result);
      }
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Step Validation logic
  const validateStep = () => {
    if (step === 1) {
      if (!formData.fullName.trim() || !formData.dob) {
        setErrorMsg('Please enter your full name and date of birth.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.address.trim() || !formData.phone.trim()) {
        setErrorMsg('Please enter your address and contact phone number.');
        return false;
      }
    } else if (step === 3) {
      if (!formData.email.trim() || !formData.password) {
        setErrorMsg('Email and password are required.');
        return false;
      }
      if (formData.password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return false;
      }
    } else if (step === 4) {
      if (!formData.nicNumber.trim()) {
        setErrorMsg('Sri Lankan NIC number is required.');
        return false;
      }
      if (!nicFrontPreview || !nicBackPreview) {
        setErrorMsg('Please upload both Front and Back images of your Sri Lankan NIC.');
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setErrorMsg(null);
    setStep(prev => prev - 1);
  };

  // Final Registration Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      // Register off-chain account
      await register({
        fullName: formData.fullName,
        dob: formData.dob,
        gender: formData.gender,
        nationality: formData.nationality,
        address: formData.address,
        district: formData.district,
        province: formData.province,
        city: formData.city,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        nicNumber: formData.nicNumber,
      });

      // Upload NIC Documents via API
      if (nicFrontPreview && nicBackPreview) {
        await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nicFrontDataUrl: nicFrontPreview,
            nicBackDataUrl: nicBackPreview,
          }),
        });
      }

      router.push('/pending-verification');
    } catch (err) {
      console.error("Registration error:", err);
      setErrorMsg(err.message || 'Registration failed. Please check your information.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted border border-border text-primary">
          <ShieldCheck className="w-3.5 h-3.5" />
          Identity Verification Registration
        </div>
        <h1 className="text-3xl font-bold font-display text-foreground">Create Voter Account</h1>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Complete the multi-step registration process to submit your identity documents for administrator verification.
        </p>
      </div>

      {/* Wizard Progress Bar */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-subtle mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
          <span className={step >= 1 ? 'text-primary font-bold' : ''}>1. Personal</span>
          <span className={step >= 2 ? 'text-primary font-bold' : ''}>2. Location</span>
          <span className={step >= 3 ? 'text-primary font-bold' : ''}>3. Account</span>
          <span className={step >= 4 ? 'text-primary font-bold' : ''}>4. NIC Upload</span>
          <span className={step >= 5 ? 'text-primary font-bold' : ''}>5. Review</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Form Panel */}
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-subtle space-y-6">
        
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          {/* STEP 1: PERSONAL INFORMATION */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2 border-b border-border pb-3">
                <User className="w-4 h-4 text-primary" />
                Step 1: Personal Details
              </h3>

              <div>
                <label className="block text-foreground font-semibold mb-1">Full Name (as on NIC) <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Ranil Perera"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground font-semibold mb-1">Date of Birth <span className="text-rose-600">*</span></label>
                  <input
                    type="date"
                    name="dob"
                    required
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION & CONTACT */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2 border-b border-border pb-3">
                <MapPin className="w-4 h-4 text-primary" />
                Step 2: Location & Contact Details
              </h3>

              <div>
                <label className="block text-foreground font-semibold mb-1">Residential Address <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street Address, House No."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-foreground font-semibold mb-1">District</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                  >
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Dehiwala"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1">Phone Number <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+94 77 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ACCOUNT CREDENTIALS */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2 border-b border-border pb-3">
                <Lock className="w-4 h-4 text-primary" />
                Step 3: Account Credentials
              </h3>

              <div>
                <label className="block text-foreground font-semibold mb-1">Email Address <span className="text-rose-600">*</span></label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="voter@example.lk"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground font-semibold mb-1">Password <span className="text-rose-600">*</span></label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1">Confirm Password <span className="text-rose-600">*</span></label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SRI LANKAN NIC UPLOAD */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2 border-b border-border pb-3">
                <FileText className="w-4 h-4 text-primary" />
                Step 4: Sri Lankan NIC Verification Documents
              </h3>

              <div>
                <label className="block text-foreground font-semibold mb-1">Sri Lankan NIC Number <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  name="nicNumber"
                  required
                  value={formData.nicNumber}
                  onChange={handleChange}
                  placeholder="e.g. 199012345678 or 901234567V"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* NIC Front Image Upload */}
                <div className="p-4 rounded-xl border border-dashed border-border bg-muted/50 space-y-3 text-center">
                  <span className="block font-bold text-foreground">NIC Front Image</span>
                  {nicFrontPreview ? (
                    <div className="space-y-2">
                      <img src={nicFrontPreview} alt="NIC Front" className="h-32 mx-auto rounded-lg object-cover border border-border" />
                      <span className="text-[11px] text-emerald-600 font-semibold block">✓ Image Loaded</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="text-[11px] text-muted-foreground">JPEG, PNG, WEBP (Max 5MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileUpload(e, 'NIC Front')}
                    className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
                  />
                </div>

                {/* NIC Back Image Upload */}
                <div className="p-4 rounded-xl border border-dashed border-border bg-muted/50 space-y-3 text-center">
                  <span className="block font-bold text-foreground">NIC Back Image</span>
                  {nicBackPreview ? (
                    <div className="space-y-2">
                      <img src={nicBackPreview} alt="NIC Back" className="h-32 mx-auto rounded-lg object-cover border border-border" />
                      <span className="text-[11px] text-emerald-600 font-semibold block">✓ Image Loaded</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="text-[11px] text-muted-foreground">JPEG, PNG, WEBP (Max 5MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileUpload(e, 'NIC Back')}
                    className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUBMIT */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2 border-b border-border pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Step 5: Review Identity Details
              </h3>

              <div className="grid grid-cols-2 gap-3 bg-muted p-4 rounded-xl border border-border text-xs">
                <div><span className="text-muted-foreground block">Full Name</span><strong className="text-foreground">{formData.fullName}</strong></div>
                <div><span className="text-muted-foreground block">NIC Number</span><strong className="text-foreground font-mono">{formData.nicNumber}</strong></div>
                <div><span className="text-muted-foreground block">Email</span><strong className="text-foreground">{formData.email}</strong></div>
                <div><span className="text-muted-foreground block">Phone</span><strong className="text-foreground">{formData.phone}</strong></div>
                <div><span className="text-muted-foreground block">District</span><strong className="text-foreground">{formData.district}</strong></div>
                <div><span className="text-muted-foreground block">NIC Uploads</span><strong className="text-emerald-600">Front & Back Verified</strong></div>
              </div>
            </div>
          )}

          {/* Step Navigation Buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 rounded-xl bg-muted text-foreground font-semibold hover:bg-border transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Submit for Verification</span>}
              </button>
            )}
          </div>

        </form>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Already registered? <Link href="/login" className="text-primary font-bold hover:underline">Log in to your account</Link>
      </p>

    </div>
  );
}
