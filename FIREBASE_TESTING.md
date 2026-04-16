# Firebase Backend Testing Guide

## 1. Setup Firebase Project

1. Go to https://console.firebase.google.com
2. Create new project (e.g., "sikshakhel-backend")
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Phone" provider
4. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in "test mode" (for development)
5. Get your config values:
   - Go to Project settings > General
   - Scroll to "Your apps" section
   - Click "Add app" > Web app (</>) icon
   - Copy the config object values

## 2. Create .env File

Create `.env` in your project root with:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 3. Test Contact Form

1. Run: `npm run dev`
2. Open browser to http://localhost:5173
3. Scroll to Contact section
4. Fill form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Project Type: "Web Development"
   - Message: "Testing backend integration"
5. Click "Submit"
6. Check console for success/error
7. Verify in Firebase Console:
   - Go to Firestore Database
   - Check "contacts" collection
   - Should see new document with form data

## 4. Test Phone Authentication

1. In your app, find/use the Login component
2. Enter phone number (with country code, e.g., +91XXXXXXXXXX)
3. Click "Send OTP"
4. Check browser console for reCAPTCHA setup
5. Enter OTP when received
6. Click "Verify OTP"
7. Check console for user object on success

## 5. Debug Tips

- Open browser DevTools > Console for error messages
- Check Network tab for Firebase API calls
- If Firestore writes fail: check Firestore rules (should be test mode)
- If Auth fails: verify phone provider is enabled
- If config missing: check .env file exists and values are correct

## 6. Production Setup

For production:
- Change Firestore rules to restrict access
- Add domain to Firebase Auth authorized domains
- Set up proper error handling and user feedback
- Consider adding email notifications via Firebase Functions