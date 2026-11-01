import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent
} from "expo-speech-recognition";

const API_BASE_URL = "https://YOUR-BACKEND-URL.example.com";
const BG = "#080D1B";
const PANEL = "#111A2E";
const PANEL2 = "#17233D";
const BLUE = "#3985FF";
const VIOLET = "#895BFF";
const MUTED = "#9AAAC7";
const WHITE = "#F5F7FF";

type Tab = "Home" | "AI" | "Innovations" | "Discover" | "Solutions";
type Message = { id: string; role: "user" | "assistant"; text: string };

const cards = [
  { icon: "sparkles", title: "BTD AI", subtitle: "Ask questions. Explore ideas.", color: "#3985FF", tab: "AI" as Tab },
  { icon: "hardware-chip", title: "Innovations", subtitle: "Inventions, robotics and technology.", color: "#9A70FF", tab: "Innovations" as Tab },
  { icon: "planet", title: "Discover", subtitle: "Science, space and new possibilities.", color: "#34B7D8", tab: "Discover" as Tab },
  { icon: "bulb", title: "Solutions", subtitle: "Ideas for real-world problems.", color: "#F2B84B", tab: "Solutions" as Tab }
];

const content: Record<Exclude<Tab, "Home" | "AI">, { heading: string; intro: string; items: { title: string; body: string; icon: string }[] }> = {
  Innovations: {
    heading: "Explore Innovations",
    intro: "Discover how creative thinking can become practical technology.",
    items: [
      { icon: "robot", title: "Robotics", body: "Explore robots, automation and machines that help people." },
      { icon: "hardware-chip", title: "Smart devices", body: "Learn how sensors and connected devices can solve everyday problems." },
      { icon: "flash", title: "Future energy", body: "Explore ideas for cleaner, more efficient energy." }
    ]
  },
  Discover: {
    heading: "Discover the Unknown",
    intro: "A starting point for curiosity about science and the universe.",
    items: [
      { icon: "planet", title: "Space & astronomy", body: "Explore planets, stars, missions and the science of space." },
      { icon: "flask", title: "Science lab", body: "Understand scientific ideas through safe experiments." },
      { icon: "leaf", title: "Our planet", body: "Explore climate, biodiversity and sustainable technology." }
    ]
  },
  Solutions: {
    heading: "Solutions for Real Life",
    intro: "Good innovation begins by understanding a real problem.",
    items: [
      { icon: "school", title: "Education", body: "Make learning clearer, more accessible and more engaging." },
      { icon: "leaf", title: "Agriculture", body: "Explore practical ideas for farmers, water and crops." },
      { icon: "people", title: "Everyday life", body: "Find thoughtful ways to improve daily tasks and communities." }
    ]
  }
};

function Brand() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>B</Text></View>
      <View>
        <Text style={styles.brandName}>BTD <Text style={{ color: "#8DB8FF" }}>GLOBAL</Text></Text>
        <Text style={styles.brandTag}>BUILD THE DESTINY</Text>
      </View>
    </View>
  );
}

function PrimaryButton({ title, onPress, icon }: { title: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.primaryButton}>
      {icon ? <Ionicons name={icon} size={18} color="white" /> : null}
      <Text style={styles.primaryButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("Home");
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", text: "Hello! I'm BTD AI, your thinking partner at BTD Global. What would you like to explore or create today?" }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useSpeechRecognitionEvent("result", (event: any) => {
    const transcript = event.results?.[0]?.transcript;
    if (transcript) setInput(transcript);
  });
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("error", (event: any) => {
    setListening(false);
    Alert.alert("Voice input", event.message || "Speech recognition could not start. Please type your question.");
  });

  useEffect(() => {
    if (tab === "AI") listRef.current?.scrollToEnd({ animated: true });
  }, [messages, tab]);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    const next: Message = { id: `${Date.now()}`, role: "user", text };
    const history = [...messages, next].slice(-14);
    setMessages(history);
    setInput("");
    setBusy(true);
    try {
      if (API_BASE_URL.includes("YOUR-BACKEND-URL")) {
        throw new Error("The secure AI server has not been connected yet. Follow SETUP.md to deploy the backend and add its URL.");
      }
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, text }) => ({ role, content: text }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The AI server returned an error.");
      const answer = String(data.answer || "I couldn't generate a reply. Please try again.");
      setMessages(prev => [...prev, { id: `${Date.now()}-a`, role: "assistant", text: answer }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-e`, role: "assistant",
        text: `Connection note: ${error.message || "Could not reach the AI server."}`
      }]);
    } finally {
      setBusy(false);
    }
  };

  const startVoice = async () => {
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone permission", "Allow microphone access to use voice input.");
        return;
      }
      setListening(true);
      ExpoSpeechRecognitionModule.start({ lang: "en-IN", interimResults: true, continuous: false });
    } catch {
      setListening(false);
      Alert.alert("Voice input unavailable", "Please type your message instead.");
    }
  };

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: "en-IN", rate: 0.96, pitch: 1.0 });
  };

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>INDIA BORN • WORLD BOUND</Text>
        <Text style={styles.heroTitle}>Think beyond.</Text>
        <Text style={[styles.heroTitle, { color: "#9BBEFF" }]}>Build the future.</Text>
        <Text style={styles.heroBody}>A place for bold ideas, intelligent technology and solutions that make a difference.</Text>
        <PrimaryButton title="Talk to BTD AI" icon="sparkles" onPress={() => setTab("AI")} />
        <View style={styles.heroGlow} />
      </View>
      <Text style={styles.sectionTitle}>Explore BTD Global</Text>
      <View style={styles.cardGrid}>
        {cards.map(card => (
          <TouchableOpacity key={card.title} style={styles.featureCard} onPress={() => setTab(card.tab)} activeOpacity={0.82}>
            <View style={[styles.iconBubble, { backgroundColor: `${card.color}22` }]}>
              <Ionicons name={card.icon as any} size={23} color={card.color} />
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            <View style={styles.cardArrow}><Ionicons name="arrow-forward" color={MUTED} size={17} /></View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.missionCard}>
        <Text style={styles.eyebrow}>OUR MISSION</Text>
        <Text style={styles.missionTitle}>Ideas into impact.</Text>
        <Text style={styles.bodyText}>Start with a problem. Imagine a better way. Build, test and improve a solution.</Text>
      </View>
    </ScrollView>
  );

  const renderChat = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
      <View style={styles.chatHeader}>
        <View style={styles.aiAvatar}><Ionicons name="sparkles" size={20} color="white" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>BTD AI</Text>
          <Text style={styles.onlineText}>Your idea and problem-solving assistant</Text>
        </View>
        <View style={styles.liveDot} />
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.messageText}>{item.text}</Text>
            {item.role === "assistant" && item.id !== "welcome" ? (
              <TouchableOpacity onPress={() => speak(item.text)} style={styles.speakButton}>
                <Ionicons name="volume-high-outline" size={17} color="#AFC9FF" />
                <Text style={styles.speakLabel}>Speak</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        ListFooterComponent={busy ? <View style={styles.typing}><ActivityIndicator color="#9BBEFF" /><Text style={styles.onlineText}>BTD AI is thinking…</Text></View> : null}
      />
      <View style={styles.composer}>
        <TouchableOpacity style={[styles.voiceButton, listening && { backgroundColor: "#743B62" }]} onPress={listening ? () => ExpoSpeechRecognitionModule.stop() : startVoice}>
          <Ionicons name={listening ? "stop" : "mic"} size={21} color="white" />
        </TouchableOpacity>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={listening ? "Listening…" : "Message BTD AI…"}
          placeholderTextColor="#71809E"
          style={styles.input}
          multiline
          maxLength={3000}
          onSubmitEditing={() => send()}
        />
        <TouchableOpacity style={styles.sendButton} onPress={() => send()} disabled={busy || !input.trim()}>
          <Ionicons name="arrow-up" size={21} color="white" />
        </TouchableOpacity>
      </View>
      <Text style={styles.disclaimer}>AI can make mistakes. Check important information.</Text>
    </KeyboardAvoidingView>
  );

  const renderSection = (section: Exclude<Tab, "Home" | "AI">) => (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>BTD GLOBAL / {section.toUpperCase()}</Text>
      <Text style={styles.sectionHero}>{content[section].heading}</Text>
      <Text style={styles.bodyText}>{content[section].intro}</Text>
      {content[section].items.map((item, i) => (
        <View key={item.title} style={styles.infoCard}>
          <View style={styles.infoIcon}><Ionicons name={item.icon as any} size={23} color="#9BBEFF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.body}</Text>
          </View>
          <Text style={styles.number}>{String(i + 1).padStart(2, "0")}</Text>
        </View>
      ))}
      <View style={styles.missionCard}>
        <Text style={styles.missionTitle}>Have an idea?</Text>
        <Text style={styles.bodyText}>Ask BTD AI to help you explore it, plan it and take the first step.</Text>
        <PrimaryButton title="Explore with BTD AI" onPress={() => setTab("AI")} icon="sparkles" />
      </View>
    </ScrollView>
  );

  const tabs: { key: Tab; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "Home", icon: "home" }, { key: "AI", icon: "sparkles" },
    { key: "Innovations", icon: "hardware-chip" }, { key: "Discover", icon: "planet" },
    { key: "Solutions", icon: "bulb" }
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <View style={styles.topBar}>
        <Brand />
        <TouchableOpacity style={styles.topIcon} onPress={() => Alert.alert("BTD Global", "Build the Destiny • Version 1.0.0")}>
          <Ionicons name="ellipsis-horizontal" color={WHITE} size={22} />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        {tab === "Home" ? renderHome() : tab === "AI" ? renderChat() : renderSection(tab)}
      </View>
      <View style={styles.bottomNav}>
        {tabs.map(item => {
          const active = tab === item.key;
          return (
            <TouchableOpacity key={item.key} style={styles.navItem} onPress={() => setTab(item.key)}>
              <Ionicons name={item.icon} size={20} color={active ? "#9BBEFF" : "#72819F"} />
              <Text numberOfLines={1} style={[styles.navLabel, active && styles.navLabelActive]}>{item.key}</Text>
              {active ? <View style={styles.navIndicator} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: { height: 66, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#1D2942" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 39, height: 39, borderRadius: 13, backgroundColor: BLUE, alignItems: "center", justifyContent: "center", shadowColor: BLUE, shadowOpacity: 0.45, shadowRadius: 12, elevation: 6 },
  brandMarkText: { color: "white", fontSize: 25, fontWeight: "900", fontStyle: "italic" },
  brandName: { color: WHITE, fontSize: 17, fontWeight: "900", letterSpacing: 1.1 },
  brandTag: { color: MUTED, fontSize: 8, letterSpacing: 2.1, marginTop: 2, fontWeight: "700" },
  topIcon: { padding: 8 },
  page: { padding: 18, paddingBottom: 28, gap: 17 },
  hero: { backgroundColor: PANEL, borderRadius: 25, padding: 22, borderWidth: 1, borderColor: "#273A60", overflow: "hidden", gap: 8 },
  eyebrow: { color: "#8EB7FF", fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  heroTitle: { color: WHITE, fontSize: 31, lineHeight: 37, fontWeight: "900", letterSpacing: -0.7 },
  heroBody: { color: "#B3C0D8", fontSize: 14, lineHeight: 21, marginTop: 5, marginBottom: 9, maxWidth: 300 },
  heroGlow: { position: "absolute", width: 170, height: 170, borderRadius: 100, backgroundColor: "#315BBD", opacity: 0.12, right: -85, top: -80 },
  primaryButton: { alignSelf: "flex-start", flexDirection: "row", gap: 9, alignItems: "center", backgroundColor: BLUE, paddingHorizontal: 17, paddingVertical: 12, borderRadius: 13, marginTop: 6 },
  primaryButtonText: { color: "white", fontSize: 13, fontWeight: "800" },
  sectionTitle: { color: WHITE, fontSize: 19, fontWeight: "800", marginTop: 3 },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 11 },
  featureCard: { width: "48%", minHeight: 145, backgroundColor: PANEL, borderRadius: 18, borderWidth: 1, borderColor: "#202D47", padding: 14, gap: 7, flexGrow: 1 },
  iconBubble: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  cardTitle: { color: WHITE, fontWeight: "800", fontSize: 14 },
  cardSubtitle: { color: MUTED, fontSize: 11, lineHeight: 16 },
  cardArrow: { position: "absolute", right: 12, bottom: 12 },
  missionCard: { backgroundColor: "#121D35", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#283B61", gap: 7 },
  missionTitle: { color: WHITE, fontSize: 21, fontWeight: "900" },
  bodyText: { color: "#AAB8D1", fontSize: 13, lineHeight: 20 },
  bottomNav: { height: 66, backgroundColor: "#0D1527", borderTopWidth: 1, borderTopColor: "#1D2942", flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingHorizontal: 4 },
  navItem: { flex: 1, height: 60, alignItems: "center", justifyContent: "center", gap: 3 },
  navLabel: { color: "#72819F", fontSize: 9, fontWeight: "700" },
  navLabelActive: { color: "#B4CEFF" },
  navIndicator: { width: 15, height: 3, borderRadius: 3, backgroundColor: BLUE, marginTop: 1 },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 11, padding: 15, borderBottomWidth: 1, borderBottomColor: "#1D2942" },
  aiAvatar: { width: 39, height: 39, borderRadius: 14, backgroundColor: VIOLET, alignItems: "center", justifyContent: "center" },
  onlineText: { color: MUTED, fontSize: 10, marginTop: 3 },
  liveDot: { width: 8, height: 8, borderRadius: 5, backgroundColor: "#54D69A" },
  messageList: { padding: 15, gap: 12, paddingBottom: 25 },
  messageBubble: { maxWidth: "88%", padding: 13, borderRadius: 17 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#2459B3", borderBottomRightRadius: 5 },
  aiBubble: { alignSelf: "flex-start", backgroundColor: PANEL2, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: "#263653" },
  messageText: { color: WHITE, fontSize: 14, lineHeight: 21 },
  speakButton: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10, alignSelf: "flex-start" },
  speakLabel: { color: "#AFC9FF", fontSize: 11, fontWeight: "700" },
  typing: { flexDirection: "row", alignItems: "center", gap: 9, padding: 12 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1D2942", backgroundColor: "#0C1425" },
  voiceButton: { width: 43, height: 43, borderRadius: 14, backgroundColor: "#283B61", alignItems: "center", justifyContent: "center" },
  input: { flex: 1, maxHeight: 105, minHeight: 43, backgroundColor: PANEL2, color: WHITE, borderRadius: 14, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 10, fontSize: 14 },
  sendButton: { width: 43, height: 43, borderRadius: 14, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" },
  disclaimer: { color: "#63718B", fontSize: 9, textAlign: "center", paddingBottom: 5, backgroundColor: "#0C1425" },
  sectionHero: { color: WHITE, fontSize: 29, lineHeight: 35, fontWeight: "900", marginTop: 3 },
  infoCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: PANEL, borderWidth: 1, borderColor: "#202D47", borderRadius: 17, padding: 15, marginTop: 2 },
  infoIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: "#263C68", alignItems: "center", justifyContent: "center" },
  number: { color: "#667895", fontSize: 11, fontWeight: "900" }
});
