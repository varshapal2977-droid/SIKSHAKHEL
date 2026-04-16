import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import type { ConfirmationResult, User } from "firebase/auth";
import { auth } from "./firebase";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

// setup recaptcha
export const setupRecaptcha = () => {
  const container = document.getElementById('recaptcha-container');
  if (!container) {
    throw new Error('No recaptcha container found');
  }

  window.recaptchaVerifier = new RecaptchaVerifier(
    auth,
    container,
    {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
    }
  );
};

// send OTP
export const sendOTP = async (phoneNumber: string) => {
  if (!window.recaptchaVerifier) {
    throw new Error("reCAPTCHA verifier is not initialized");
  }

  const confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    window.recaptchaVerifier
  );

  window.confirmationResult = confirmationResult;
};

// verify OTP
export const verifyOTP = async (code: string): Promise<User> => {
  if (!window.confirmationResult) {
    throw new Error("No confirmation result available. Please send OTP first.");
  }

  const result = await window.confirmationResult.confirm(code);
  return result.user;
};
