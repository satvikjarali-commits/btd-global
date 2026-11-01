# BTD Global: Android-only setup

You can do the setup from Chrome on Android, but a cloud coding/build service is still needed because compiling a native APK on a phone is difficult.

## A. Get the source

1. Download and extract `BTD_GLOBAL_Android_Project.zip`.
2. Keep the extracted `btd-global` folder together.

## B. Backend

1. Create an account on a Node.js hosting provider that supports private environment variables.
2. Create a new Node.js service and upload the `server` folder (or connect a private Git repository containing it).
3. Set the start command to `npm start`.
4. Add `OPENAI_API_KEY` as a private secret in the hosting dashboard.
5. Add `OPENAI_MODEL` with a model enabled for your API project, e.g. `gpt-5-mini`.
6. Deploy and copy the HTTPS service URL.
7. Check `https://YOUR-SERVICE/health`.

Do not send your API key to anyone or add it to the app source.

## C. App build

1. Use a cloud development workspace that supports a terminal and Node.js.
2. Upload the project files.
3. In the terminal run `npm install`.
4. Edit `App.tsx`: replace `https://YOUR-BACKEND-URL.example.com` with your deployed HTTPS backend URL.
5. Run `npx expo-doctor`.
6. Run `npx eas-cli@latest login` and sign in to Expo.
7. Run `npx eas-cli@latest build:configure`.
8. Run `npx eas-cli@latest build --platform android --profile preview`.
9. When Expo finishes, open the build link on your phone and download the APK.

If you tell me which cloud workspace you can access, I can guide you through its exact Android-screen steps.

## Costs

- This starter code is free.
- Cloud build free-tier limits may apply.
- OpenAI API calls can cost money; they are not included in ChatGPT.
- Hosting may have free-tier limits or may require a paid plan after usage grows.
