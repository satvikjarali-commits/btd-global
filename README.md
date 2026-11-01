# BTD GLOBAL — BUILD THE DESTINY

An Expo / React Native Android app starter with a separate Node.js backend for OpenAI.

## Included

- Premium dark interface with electric-blue and violet accents
- Home, BTD AI, Innovations, Discover and Solutions sections
- AI chat using OpenAI's Responses API through a private backend
- Speech-to-text input using Android speech recognition
- Text-to-speech replies using Expo Speech
- Android APK build profile through Expo Application Services (EAS)

## Important: what this project is and is not

This ZIP contains the app source project and backend source. It is **not yet a compiled APK**, and the AI chat will not connect until you deploy the backend and set its URL in `App.tsx`.

OpenAI API usage is billed separately from ChatGPT and can incur charges. Set usage limits in your OpenAI Platform account and keep the key on the backend only. Do not send the key in chat or put it in the mobile app.

## 1. Deploy the backend

Use a Node.js hosting service that supports environment variables and HTTPS. From the `server` folder:

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`.
3. Set `OPENAI_API_KEY` in the host's private environment-variable settings. Do not commit `.env`.
4. Set `OPENAI_MODEL` to a model available to your API project. The default in this starter is `gpt-5-mini`.
5. Start command: `npm start`
6. Confirm the host's `/health` URL returns `{"ok":true}`.

The host must provide a public HTTPS URL for the Android app to call. Do not expose the API key in any client-side code.

## 2. Connect the app to the backend

Open `App.tsx` and replace:

`https://YOUR-BACKEND-URL.example.com`

with your backend's HTTPS base URL (no trailing slash).

## 3. Build an installable Android APK

Expo EAS Build performs the Android compilation in the cloud; an Expo account is required. The preview profile in `eas.json` is configured to make an installable APK.

From a terminal in the project root:

```bash
npm install
npx expo install --check
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

Follow the prompts. When the build completes, open the build page on your Android phone, download the APK, and install it. Android may ask you to allow installation from that browser.

The free EAS tier has usage limits and availability can change. A Google Play developer account is not needed to install a test APK. Publishing to Google Play has separate account, policy and fee requirements.

## 4. Test

- Open BTD Global.
- Select AI.
- Type a short question.
- Try the microphone and grant permission.
- Tap Speak under an AI answer to hear it.

## Troubleshooting

- **AI server not connected:** Check the URL in `App.tsx` and confirm `/health` works.
- **401 / 403 from OpenAI:** Check that the backend secret is valid and belongs to an API project with access.
- **429 / quota error:** Check API billing, project limits and rate limits.
- **Voice input unavailable:** Check Android microphone permission and speech recognition availability. Typing still works.
- **Build dependency issue:** Run `npx expo-doctor` and follow its compatibility advice.

## Security checklist

- Never commit `.env`.
- Never paste the OpenAI key into App.tsx.
- Rotate the key immediately if it is exposed.
- Add authentication and per-user quotas before opening the backend publicly. The included IP rate limit is only a starter safeguard.
