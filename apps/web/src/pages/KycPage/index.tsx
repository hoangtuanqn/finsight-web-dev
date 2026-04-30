import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useKycStatus } from '../../hooks/useKycQuery';
import KycStepper from './components/KycStepper';
import Step1_IdCapture from './components/Step1_IdCapture';
import Step2_LivenessCapture from './components/Step2_LivenessCapture';
import Step3_Review from './components/Step3_Review';
import KycResultScreen from './components/KycResultScreen';
import { useAuth } from '../../context/AuthContext';

export default function KycPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: kyc, isLoading } = useKycStatus();

  const [step, setStep] = useState(1);
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Redirect if already verified
  useEffect(() => {
    if (!isLoading && kyc?.kycStatus === 'VERIFIED' && !isCompleted) {
      setIsCompleted(true);
    }
  }, [kyc, isLoading, isCompleted]);

  // Require name update before KYC
  useEffect(() => {
    if (!isLoading && user && !user.fullName) {
      navigate('/profile', { state: { requireName: true } });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isCompleted || kyc?.kycStatus === 'VERIFIED') {
    return (
      <div className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full">
        <KycResultScreen kycName={kyc?.kycName} kycIdNumber={kyc?.kycIdNumber} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Shield className="text-blue-500" /> Xác minh danh tính (eKYC)
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Bảo mật tài khoản của bạn với định danh kỹ thuật số an toàn nhất.
          </p>
        </div>
      </div>

      <div className="bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border)] shadow-sm p-6 sm:p-10">
        <KycStepper currentStep={step} />

        <div className="mt-10">
          {step === 1 && (
            <Step1_IdCapture 
              initialFront={frontImage}
              initialBack={backImage}
              onNext={(front, back) => {
                setFrontImage(front);
                setBackImage(back);
                setStep(2);
              }} 
            />
          )}

          {step === 2 && (
            <Step2_LivenessCapture 
              onBack={() => setStep(1)}
              onNext={(video) => {
                setVideoFile(video);
                setStep(3);
              }}
            />
          )}

          {step === 3 && frontImage && backImage && videoFile && (
            <Step3_Review 
              frontImage={frontImage}
              backImage={backImage}
              videoFile={videoFile}
              onBack={() => setStep(2)}
              onComplete={() => setIsCompleted(true)}
            />
          )}
        </div>
      </div>

    </div>
  );
}
