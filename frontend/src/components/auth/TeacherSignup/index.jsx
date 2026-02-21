import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Step1Email from './Step1Email';
import Step2OTP from './Step2OTP';
import Step3Registration from './Step3Registration';

const TeacherSignup = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [verified, setVerified] = useState(false);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      step >= stepNumber
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  <span className="mt-2 text-sm font-medium">
                    {stepNumber === 1 && 'Email'}
                    {stepNumber === 2 && 'Verify OTP'}
                    {stepNumber === 3 && 'Complete Profile'}
                  </span>
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step > stepNumber ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Step1Email key="step1" email={email} setEmail={setEmail} onNext={nextStep} />
            )}
            {step === 2 && (
              <Step2OTP
                key="step2"
                email={email}
                onPrev={prevStep}
                onNext={nextStep}
                markVerified={setVerified}
              />
            )}
            {step === 3 && (
              <Step3Registration key="step3" email={email} onPrev={prevStep} verified={verified} />
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>
            By registering, you agree to our{' '}
            <button className="text-purple-600 dark:text-purple-400 hover:underline">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-purple-600 dark:text-purple-400 hover:underline">
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherSignup;

























