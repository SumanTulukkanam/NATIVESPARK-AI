// js/ai-assistant.js - ENHANCED WITH LANGUAGE SUPPORT & SPEECH-TO-TEXT
class AIAssistant {
    constructor() {
        // API Configuration
        this.apiProvider = 'groq';
        this.apiKeys = {
            huggingface: null,
            groq: null
        };
        
        this.endpoints = {
            groq: 'https://api.groq.com/openai/v1/chat/completions',
            huggingface: 'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-alpha',
            ollama: 'http://localhost:11434/api/generate'
        };
        
        // Ollama models
        this.ollamaModels = {
            'phi3:mini': 'phi3:mini',
            'tinyllama:latest': 'tinyllama:latest',
            'gemma2:2b': 'gemma2:2b'
        };
        
        this.currentOllamaModel = 'phi3:mini';
        this.conversationHistory = [];
        this.maxHistoryLength = 10;
        this.isProcessing = false;
        
        // Language Configuration - ENHANCED
        this.selectedLanguage = 'auto';
        this.languageMap = {
            'auto': { name: 'Auto (User\'s language)', code: 'en-US' },
            'english': { name: 'English', code: 'en-US' },
            'tamil': { name: 'Tamil - தமிழ்', code: 'ta-IN' },
            'spanish': { name: 'Español (Spanish)', code: 'es-ES' },
            'french': { name: 'Français (French)', code: 'fr-FR' },
            'german': { name: 'Deutsch (German)', code: 'de-DE' },
            'japanese': { name: '日本語 (Japanese)', code: 'ja-JP' },
            'hindi': { name: 'हिन्दी (Hindi)', code: 'hi-IN' }
        };
        
        // Enhanced language instructions with better prompts
        this.languageInstructions = {
            'auto': 'Detect and respond in the same language as the user.',
            'english': 'You must respond ONLY in English. Do not use any other language.',
            'tamil': 'நீங்கள் தமிழில் மட்டுமே பதிலளிக்க வேண்டும். You must respond ONLY in Tamil language using Tamil script.',
            'spanish': 'Debes responder SOLO en español. You must respond ONLY in Spanish.',
            'french': 'Vous devez répondre UNIQUEMENT en français. You must respond ONLY in French.',
            'german': 'Sie müssen NUR auf Deutsch antworten. You must respond ONLY in German.',
            'japanese': '日本語でのみ応答してください。You must respond ONLY in Japanese.',
            'hindi': 'आपको केवल हिंदी में जवाब देना होगा। You must respond ONLY in Hindi using Devanagari script.'
        };
        
        // Speech Recognition Setup
        this.recognition = null;
        this.isListening = false;
        this.setupSpeechRecognition();
        
        // Base system prompt
        this.baseSystemPrompt = `You are Zeno, a friendly AI assistant for NativeSpark, a language learning platform.
Be helpful, encouraging, and patient. Keep responses concise (2-3 sentences) unless asked for detail.`;

        console.log('🤖 AI Assistant initialized with multilanguage & speech support');
        console.log(`📡 Default provider: ${this.apiProvider}`);
        console.log(`🌐 Languages: ${Object.keys(this.languageMap).join(', ')}`);
        console.log(`🎤 Speech Recognition: ${this.recognition ? 'Available' : 'Not Available'}`);
    }

    // Setup Speech Recognition
    setupSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('⚠️ Speech Recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
        
        // Set language based on selected language
        this.updateRecognitionLanguage();
        
        // Event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('🎤 Speech recognition started');
            this.onSpeechStart?.();
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            console.log('🎤 Speech recognition ended');
            this.onSpeechEnd?.();
        };
        
        this.recognition.onerror = (event) => {
            console.error('🎤 Speech recognition error:', event.error);
            this.isListening = false;
            this.onSpeechError?.(event.error);
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;
            
            console.log(`🎤 Recognized (${(confidence * 100).toFixed(0)}%):`, transcript);
            this.onSpeechResult?.(transcript, confidence);
        };
        
        console.log('✅ Speech Recognition configured');
    }

    // Update recognition language when language changes
    updateRecognitionLanguage() {
        if (!this.recognition) return;
        
        const langCode = this.languageMap[this.selectedLanguage]?.code || 'en-US';
        this.recognition.lang = langCode;
        console.log(`🌐 Speech recognition language set to: ${langCode}`);
    }

    // Start listening
    startListening() {
        if (!this.recognition) {
            const error = 'Speech recognition not available in this browser';
            console.error('❌', error);
            this.onSpeechError?.(error);
            return false;
        }
        
        if (this.isListening) {
            console.warn('⚠️ Already listening');
            return false;
        }
        
        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('❌ Failed to start speech recognition:', error);
            this.onSpeechError?.(error.message);
            return false;
        }
    }

    // Stop listening
    stopListening() {
        if (!this.recognition || !this.isListening) return;
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('❌ Failed to stop speech recognition:', error);
        }
    }

    // Toggle listening
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
            return false;
        } else {
            return this.startListening();
        }
    }

    // Get listening state
    getListeningState() {
        return this.isListening;
    }

    // Build dynamic system prompt based on context and language
    getSystemPrompt(userMessage = '') {
        let prompt = this.baseSystemPrompt;
        
        // IMPORTANT: Add language instruction prominently
        if (this.selectedLanguage !== 'auto') {
            const langInstruction = this.languageInstructions[this.selectedLanguage];
            prompt = `${langInstruction}\n\n${prompt}`;
        } else {
            prompt = `${this.languageInstructions['auto']}\n\n${prompt}`;
        }
        
        // Check if user is asking about language learning
        const languageKeywords = ['teach', 'learn', 'spanish', 'french', 'german', 'japanese', 'chinese', 'korean', 'italian', 'portuguese', 'russian', 'arabic', 'hindi', 'vietnamese', 'thai', 'language'];
        const mentionsLanguage = languageKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
        
        if (mentionsLanguage) {
            prompt += `\nYou are specialized in language teaching. Provide:
- Clear explanations of grammar and vocabulary
- Practical examples and usage tips
- Encouragement and learning strategies
- Use emojis occasionally to be friendly`;
        }
        
        return prompt;
    }

    // Main method to send messages
    async sendMessage(prompt) {
        if (!prompt || prompt.trim() === '') {
            return "⚠️ Please type something!";
        }

        if (this.isProcessing) {
            return "⏳ I'm still processing your previous message. Please wait a moment...";
        }

        this.isProcessing = true;
        console.log(`💬 Processing message with ${this.apiProvider} in ${this.selectedLanguage}:`, prompt);
        
        try {
            let response;
            
            switch (this.apiProvider) {
                case 'groq':
                    response = await this.queryGroq(prompt);
                    break;
                case 'huggingface':
                    response = await this.queryHuggingFace(prompt);
                    break;
                case 'ollama':
                    response = await this.queryOllama(prompt);
                    break;
                default:
                    throw new Error('Unknown provider');
            }

            this.addToHistory(prompt, response);
            console.log('✅ Response received:', response.substring(0, 50) + '...');
            return response;
            
        } catch (error) {
            console.error('❌ API Error:', error);
            return `⚠️ ${error.message || 'Connection error. Please check your internet and try again.'}`;
        } finally {
            this.isProcessing = false;
        }
    }

    // Groq API - With enhanced language support
    async queryGroq(prompt) {
        console.log('🚀 Querying Groq API...');
        
        try {
            const systemPrompt = this.getSystemPrompt(prompt);
            
            const messages = [
                { role: "system", content: systemPrompt },
                ...this.conversationHistory.slice(-5).map(item => ([
                    { role: "user", content: item.user },
                    { role: "assistant", content: item.assistant }
                ])).flat(),
                { role: "user", content: prompt }
            ];

            const response = await fetch(this.endpoints.groq, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKeys.groq}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500,
                    top_p: 1,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response format from Groq');
            }

            return data.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('Groq Error:', error);
            throw new Error(`Groq API failed: ${error.message}`);
        }
    }

    // HuggingFace API
    async queryHuggingFace(prompt) {
        console.log('🤗 Querying HuggingFace API...');
        
        try {
            const systemPrompt = this.getSystemPrompt(prompt);
            const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`;
            
            const response = await fetch(this.endpoints.huggingface, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKeys.huggingface}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    inputs: fullPrompt,
                    parameters: {
                        max_new_tokens: 200,
                        temperature: 0.7,
                        top_k: 50,
                        top_p: 0.95,
                        do_sample: true
                    },
                    options: {
                        wait_for_model: true
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HuggingFace API error: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            
            if (Array.isArray(data) && data[0]?.generated_text) {
                return data[0].generated_text.replace(fullPrompt, '').trim();
            } else if (data.generated_text) {
                return data.generated_text.replace(fullPrompt, '').trim();
            } else if (data.error) {
                throw new Error(`Model loading: ${data.error}`);
            } else {
                throw new Error('Unexpected response format');
            }
            
        } catch (error) {
            console.error('HuggingFace Error:', error);
            throw new Error(`HuggingFace API failed: ${error.message}`);
        }
    }

    // Ollama Local API
    async queryOllama(prompt) {
        console.log('🏠 Querying Ollama (local)...');
        
        try {
            const healthCheck = await fetch('http://localhost:11434/api/tags', {
                method: 'GET'
            }).catch(() => null);

            if (!healthCheck || !healthCheck.ok) {
                throw new Error('Ollama is not running. Start it with: ollama serve');
            }

            const systemPrompt = this.getSystemPrompt(prompt);
            
            const response = await fetch(this.endpoints.ollama, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    model: this.currentOllamaModel,
                    prompt: `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        num_predict: 200,
                        top_k: 40,
                        top_p: 0.9
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.response) {
                throw new Error('No response from Ollama model');
            }

            return data.response.trim();
            
        } catch (error) {
            console.error('Ollama Error:', error);
            throw new Error(`Ollama failed: ${error.message}`);
        }
    }

    // Set language - ENHANCED
    setLanguage(language) {
        if (this.languageMap.hasOwnProperty(language)) {
            this.selectedLanguage = language;
            this.updateRecognitionLanguage();
            
            console.log(`🌐 Language set to: ${this.languageMap[language].name}`);
            console.log(`🎤 Speech recognition language: ${this.languageMap[language].code}`);
            
            return true;
        }
        console.warn(`Unknown language: ${language}`);
        return false;
    }

    // Get current language
    getCurrentLanguage() {
        return {
            code: this.selectedLanguage,
            name: this.languageMap[this.selectedLanguage].name,
            speechCode: this.languageMap[this.selectedLanguage].code
        };
    }

    // Get available languages
    getAvailableLanguages() {
        return this.languageMap;
    }

    // Check if speech recognition is available
    isSpeechAvailable() {
        return this.recognition !== null;
    }

    // Switch API provider
    setProvider(provider) {
        const validProviders = ['groq', 'huggingface', 'ollama'];
        if (!validProviders.includes(provider)) {
            console.error(`Invalid provider: ${provider}`);
            return false;
        }
        
        this.apiProvider = provider;
        console.log(`🔄 Switched to provider: ${provider}`);
        return true;
    }

    // Set Ollama model
    setOllamaModel(modelName) {
        if (this.ollamaModels[modelName]) {
            this.currentOllamaModel = modelName;
            console.log(`🔄 Switched Ollama model to: ${modelName}`);
            return true;
        }
        console.warn(`Unknown Ollama model: ${modelName}`);
        return false;
    }

    // Update API keys
    setAPIKey(provider, key) {
        if (this.apiKeys.hasOwnProperty(provider)) {
            this.apiKeys[provider] = key;
            console.log(`🔑 API key updated for ${provider}`);
            return true;
        }
        console.warn(`Unknown provider: ${provider}`);
        return false;
    }

    // Add to conversation history
    addToHistory(userMessage, assistantResponse) {
        this.conversationHistory.push({
            user: userMessage,
            assistant: assistantResponse,
            timestamp: new Date().toISOString(),
            language: this.selectedLanguage
        });

        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
    }

    // Clear history
    clearHistory() {
        this.conversationHistory = [];
        console.log('🗑️ Conversation history cleared');
    }

    // Get current provider
    getCurrentProvider() {
        return this.apiProvider;
    }

    // Test connection
    async testConnection(provider = null) {
        const testProvider = provider || this.apiProvider;
        console.log(`🔍 Testing connection to ${testProvider}...`);
        
        const originalProvider = this.apiProvider;
        if (provider) this.apiProvider = provider;
        
        try {
            const response = await this.sendMessage("Hello, test connection");
            this.apiProvider = originalProvider;
            return {
                success: true,
                provider: testProvider,
                response: response
            };
        } catch (error) {
            this.apiProvider = originalProvider;
            return {
                success: false,
                provider: testProvider,
                error: error.message
            };
        }
    }

    // Get available providers status
    async getProvidersStatus() {
        const status = {};
        
        // Test Groq
        try {
            const groqTest = await fetch(this.endpoints.groq, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.groq}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 1
                })
            });
            status.groq = groqTest.ok;
        } catch {
            status.groq = false;
        }

        // Test HuggingFace
        try {
            const hfTest = await fetch(this.endpoints.huggingface, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKeys.huggingface}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: 'test' })
            });
            status.huggingface = hfTest.ok;
        } catch {
            status.huggingface = false;
        }

        // Test Ollama
        try {
            const ollamaTest = await fetch('http://localhost:11434/api/tags');
            status.ollama = ollamaTest.ok;
        } catch {
            status.ollama = false;
        }

        return status;
    }
}

// Create singleton instance
const aiAssistant = new AIAssistant();

// Attach to window for global access
window.aiAssistant = aiAssistant;
window.aiChatbot = aiAssistant;

console.log("✅ Enhanced AI Assistant loaded successfully");
console.log("🔑 Groq API: Available");
console.log("🔑 HuggingFace API: Available");
console.log("🏠 Ollama: Check with /api/tags");
console.log("🌐 Multilanguage support: Enabled");
console.log("🎤 Speech-to-Text: " + (aiAssistant.isSpeechAvailable() ? "Enabled" : "Not Available"));

export default aiAssistant;