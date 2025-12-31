// js/learning-engine.js - Complete Learning Content System with Tamil TTS
import { db, doc, setDoc, getDoc, updateDoc } from '../config/firebase-config.js';

class LearningEngine {
    constructor() {
        this.supportedLanguages = ['en', 'ta', 'hi', 'fr', 'de'];
        this.moduleTypes = ['alphabets', 'vocabulary', 'grammar', 'assessment'];
        
        // Initialize Tamil TTS System
        this.initializeTamilTTS();
        
        // Pre-built comprehensive curriculum
        this.curriculum = this.initializeCurriculum();
        
        console.log('📚 Learning Engine initialized with 5 languages and Tamil TTS');
    }

    // ========== TAMIL TTS SYSTEM ==========
    initializeTamilTTS() {
        this.voices = [];
        this.tamilVoice = null;
        this.ttsInitialized = false;
        
        // Tamil pronunciation mappings
        this.tamilPronunciation = {
            // Vowels (உயிர் எழுத்துகள்)
            'அ': 'அ', 'ஆ': 'ஆ', 'இ': 'இ', 'ஈ': 'ஈ',
            'உ': 'உ', 'ஊ': 'ஊ', 'எ': 'எ', 'ஏ': 'ஏ',
            'ஐ': 'ஐ', 'ஒ': 'ஒ', 'ஓ': 'ஓ', 'ஔ': 'ஔ',
            
            // Consonants (மெய் எழுத்துகள்)
            'க்': 'க', 'ங்': 'ங', 'ச்': 'ச', 'ஞ்': 'ஞ',
            'ட்': 'ட', 'ண்': 'ண', 'த்': 'த', 'ந்': 'ந',
            'ப்': 'ப', 'ம்': 'ம', 'ய்': 'ய', 'ர்': 'ர',
            'ல்': 'ல', 'வ்': 'வ', 'ழ்': 'ழ', 'ள்': 'ள',
            'ற்': 'ற', 'ன்': 'ன'
        };
        
        // Load voices immediately
        this.loadVoices();
        
        // Set up voices changed listener
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
        
        console.log('🔊 Tamil TTS system initialized');
    }

    loadVoices() {
        this.voices = speechSynthesis.getVoices();
        
        // Find Tamil voice, fallback to Hindi, then default
        this.tamilVoice = this.voices.find(v => v.lang.startsWith('ta')) || 
                         this.voices.find(v => v.lang === 'hi-IN') || 
                         this.voices[0];
        
        if (this.voices.length > 0) {
            console.log('🔊 Voices loaded:', this.voices.length);
            console.log('🔊 Selected voice:', this.tamilVoice ? `${this.tamilVoice.name} (${this.tamilVoice.lang})` : 'None');
        }
    }

    // Initialize TTS with user gesture (REQUIRED for browsers)
    initializeTTS() {
        if (this.ttsInitialized) {
            console.log('✅ TTS already initialized');
            return true;
        }
        
        try {
            // Create empty utterance to initialize speech synthesis
            const test = new SpeechSynthesisUtterance('');
            test.volume = 0; // Silent
            test.onstart = () => {
                speechSynthesis.cancel(); // Immediately cancel
                this.ttsInitialized = true;
                console.log('✅ TTS initialized with user gesture');
            };
            
            speechSynthesis.speak(test);
            
            // Fallback: mark as initialized after short delay
            setTimeout(() => {
                if (!this.ttsInitialized) {
                    this.ttsInitialized = true;
                    console.log('✅ TTS initialized via timeout fallback');
                }
            }, 100);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize TTS:', error);
            return false;
        }
    }

    // Speak Tamil text with proper pronunciation
    speakTamil(text, options = {}) {
        return new Promise((resolve, reject) => {
            // Check if we're in a secure context
            if (!window.isSecureContext) {
                console.warn('⚠️ TTS requires HTTPS for full functionality');
            }
            
            if (!text) {
                reject('No text provided');
                return;
            }
            
            // Clear any ongoing speech
            speechSynthesis.cancel();
            
            // Get pronunciation mapping if available
            const audioText = this.tamilPronunciation[text] || text;
            
            const utterance = new SpeechSynthesisUtterance(audioText);
            
            // Use Tamil voice if available
            if (this.tamilVoice) {
                utterance.voice = this.tamilVoice;
            }
            
            // Language-specific settings
            utterance.lang = 'ta-IN';
            utterance.rate = options.rate || 0.7;
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 1;
            
            utterance.onend = () => {
                console.log('✅ Finished speaking:', text);
                resolve();
            };
            
            utterance.onerror = (e) => {
                console.error('❌ Speech error:', e.error);
                reject(e);
            };
            
            try {
                speechSynthesis.speak(utterance);
                console.log('🔊 Speaking:', audioText, '(from:', text + ')');
            } catch (e) {
                console.error('❌ Exception:', e);
                reject(e);
            }
        });
    }

    // Speak Tamil letter (with pronunciation mapping)
    speakTamilLetter(letter, options = {}) {
        return this.speakTamil(letter, options);
    }

    // Speak Tamil word
    speakTamilWord(word, options = {}) {
        return this.speakTamil(word, options);
    }

    // Speak Tamil sentence (slower)
    speakTamilSentence(sentence, options = {}) {
        const sentenceOptions = {
            rate: 0.6,
            ...options
        };
        return this.speakTamil(sentence, sentenceOptions);
    }

    // Speak multiple items in sequence
    async speakTamilSequence(items, delay = 500) {
        for (const item of items) {
            try {
                await this.speakTamil(item);
                // Add delay between items
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } catch (error) {
                console.error('Error in sequence:', error);
            }
        }
    }

    // Stop any ongoing speech
    stopSpeaking() {
        speechSynthesis.cancel();
        console.log('🛑 Speech stopped');
    }

    // Check if TTS is initialized
    isTTSInitialized() {
        return this.ttsInitialized;
    }

    // Get TTS info
    getTTSInfo() {
        return {
            initialized: this.ttsInitialized,
            voiceAvailable: this.tamilVoice !== null,
            voiceName: this.tamilVoice ? this.tamilVoice.name : 'None',
            voiceLang: this.tamilVoice ? this.tamilVoice.lang : 'None',
            totalVoices: this.voices.length
        };
    }

    // Test TTS functionality
    testTTS() {
        console.log('🔊 Testing TTS system...');
        console.log('TTS Initialized:', this.ttsInitialized);
        console.log('Available Voices:', this.voices.length);
        console.log('Selected Voice:', this.tamilVoice);
        console.log('Secure Context:', window.isSecureContext);
        
        return this.getTTSInfo();
    }

    // ========== SPEAK WORD FUNCTION ==========
    // Speak the actual word instead of just the letter
    speakWordForLetter(letterData, options = {}) {
        if (!letterData || !letterData.word) {
            console.warn('No word data provided for letter');
            return Promise.reject('No word data');
        }
        
        // Extract the first word if there are multiple words
        const wordToSpeak = typeof letterData.word === 'string' 
            ? letterData.word.split(',')[0].trim() // Take first word if multiple
            : letterData.word;
            
        console.log('🔊 Speaking word for letter:', wordToSpeak);
        
        // Use the appropriate speaking method based on language
        if (options.language === 'ta') {
            return this.speakTamilWord(wordToSpeak, options);
        } else {
            return this.speakGenericWord(wordToSpeak, options);
        }
    }

    // Speak generic words (non-Tamil)
    speakGenericWord(word, options = {}) {
        return new Promise((resolve, reject) => {
            if (!word) {
                reject('No word provided');
                return;
            }
            
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(word);
            
            // Set language based on options or default to English
            utterance.lang = options.lang || 'en-US';
            utterance.rate = options.rate || 0.8;
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 1;
            
            utterance.onend = () => {
                console.log('✅ Finished speaking word:', word);
                resolve();
            };
            
            utterance.onerror = (e) => {
                console.error('❌ Word speech error:', e.error);
                reject(e);
            };
            
            try {
                speechSynthesis.speak(utterance);
                console.log('🔊 Speaking word:', word);
            } catch (e) {
                console.error('❌ Exception:', e);
                reject(e);
            }
        });
    }

    // ========== CURRICULUM DATA ==========
    initializeCurriculum() {
        return {
            // ALPHABETS MODULE
            alphabets: {
                en: {
                    title: "English Alphabets",
                    lessons: [
                        {
                            id: 'en-alpha-1',
                            title: "A to M - First Half",
                            content: "Learn the first 13 letters of the English alphabet with pronunciation and examples.",
                            letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
                            examples: {
                                'A': {word: 'Apple', pronunciation: '/ˈæp.əl/', speakText: 'Apple'},
                                'B': {word: 'Ball', pronunciation: '/bɔːl/', speakText: 'Ball'},
                                'C': {word: 'Cat', pronunciation: '/kæt/', speakText: 'Cat'},
                                'D': {word: 'Dog', pronunciation: '/dɒɡ/', speakText: 'Dog'},
                                'E': {word: 'Elephant', pronunciation: '/ˈel.ɪ.fənt/', speakText: 'Elephant'},
                                'F': {word: 'Fish', pronunciation: '/fɪʃ/', speakText: 'Fish'},
                                'G': {word: 'Goat', pronunciation: '/ɡoʊt/', speakText: 'Goat'},
                                'H': {word: 'Hat', pronunciation: '/hæt/', speakText: 'Hat'},
                                'I': {word: 'Ice', pronunciation: '/aɪs/', speakText: 'Ice'},
                                'J': {word: 'Jug', pronunciation: '/dʒʌɡ/', speakText: 'Jug'},
                                'K': {word: 'Kite', pronunciation: '/kaɪt/', speakText: 'Kite'},
                                'L': {word: 'Lion', pronunciation: '/ˈlaɪ.ən/', speakText: 'Lion'},
                                'M': {word: 'Monkey', pronunciation: '/ˈmʌŋ.ki/', speakText: 'Monkey'}
                            },
                            pronunciation: {
                                'A': '/æ/ as in apple',
                                'B': '/b/ as in ball', 
                                'C': '/k/ as in cat',
                                'D': '/d/ as in dog',
                                'E': '/ɛ/ as in elephant',
                                'F': '/f/ as in fish',
                                'G': '/g/ as in goat',
                                'H': '/h/ as in hat',
                                'I': '/aɪ/ as in ice',
                                'J': '/dʒ/ as in jug',
                                'K': '/k/ as in kite',
                                'L': '/l/ as in lion',
                                'M': '/m/ as in monkey'
                            },
                            exercises: [
                                { 
                                    type: 'match', 
                                    question: 'Match A with the correct word', 
                                    options: ['Apple', 'Ball', 'Cat'],
                                    answer: 'Apple',
                                    explanation: 'A is for Apple',
                                    audioText: 'Apple'
                                },
                                { 
                                    type: 'identify', 
                                    question: 'What letter does "Dog" start with?', 
                                    options: ['D', 'B', 'C'],
                                    answer: 'D',
                                    explanation: 'Dog starts with the letter D',
                                    audioText: 'Dog'
                                },
                                {
                                    type: 'sequence',
                                    question: 'What letter comes after C?',
                                    options: ['D', 'B', 'E'],
                                    answer: 'D',
                                    explanation: 'The sequence is A, B, C, D, E...',
                                    audioText: 'D'
                                },
                                {
                                    type: 'pronunciation',
                                    question: 'How do you pronounce the letter G?',
                                    options: ['/g/ as in goat', '/dʒ/ as in giant', '/ʒ/ as in measure'],
                                    answer: '/g/ as in goat',
                                    explanation: 'G makes the /g/ sound in words like goat, game, and good',
                                    audioText: 'Goat'
                                }
                            ],
                            practiceWords: [
                                {word: 'Ant', pronunciation: '/ænt/', speakText: 'Ant'},
                                {word: 'Bat', pronunciation: '/bæt/', speakText: 'Bat'},
                                {word: 'Cap', pronunciation: '/kæp/', speakText: 'Cap'},
                                {word: 'Dot', pronunciation: '/dɒt/', speakText: 'Dot'},
                                {word: 'Egg', pronunciation: '/eɡ/', speakText: 'Egg'},
                                {word: 'Fan', pronunciation: '/fæn/', speakText: 'Fan'},
                                {word: 'Gap', pronunciation: '/ɡæp/', speakText: 'Gap'},
                                {word: 'Hop', pronunciation: '/hɒp/', speakText: 'Hop'},
                                {word: 'Ink', pronunciation: '/ɪŋk/', speakText: 'Ink'},
                                {word: 'Jam', pronunciation: '/dʒæm/', speakText: 'Jam'},
                                {word: 'Kit', pronunciation: '/kɪt/', speakText: 'Kit'},
                                {word: 'Lip', pronunciation: '/lɪp/', speakText: 'Lip'},
                                {word: 'Map', pronunciation: '/mæp/', speakText: 'Map'}
                            ],
                            tips: [
                                'Practice writing each letter in uppercase and lowercase',
                                'Say the sound out loud when you see the letter',
                                'Look for these letters in books and signs around you'
                            ]
                        },
                        {
                            id: 'en-alpha-2',
                            title: "N to Z - Second Half",
                            content: "Complete the English alphabet learning from N to Z with detailed examples and practice.",
                            letters: ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
                            examples: {
                                'N': {word: 'Nest', pronunciation: '/nest/', speakText: 'Nest'},
                                'O': {word: 'Orange', pronunciation: '/ˈɒr.ɪndʒ/', speakText: 'Orange'},
                                'P': {word: 'Pen', pronunciation: '/pen/', speakText: 'Pen'},
                                'Q': {word: 'Queen', pronunciation: '/kwiːn/', speakText: 'Queen'},
                                'R': {word: 'Rat', pronunciation: '/ræt/', speakText: 'Rat'},
                                'S': {word: 'Sun', pronunciation: '/sʌn/', speakText: 'Sun'},
                                'T': {word: 'Tiger', pronunciation: '/ˈtaɪ.ɡər/', speakText: 'Tiger'},
                                'U': {word: 'Umbrella', pronunciation: '/ʌmˈbrel.ə/', speakText: 'Umbrella'},
                                'V': {word: 'Van', pronunciation: '/væn/', speakText: 'Van'},
                                'W': {word: 'Water', pronunciation: '/ˈwɔː.tər/', speakText: 'Water'},
                                'X': {word: 'Xylophone', pronunciation: '/ˈzaɪ.lə.foʊn/', speakText: 'Xylophone'},
                                'Y': {word: 'Yellow', pronunciation: '/ˈjel.oʊ/', speakText: 'Yellow'},
                                'Z': {word: 'Zebra', pronunciation: '/ˈzeb.rə/', speakText: 'Zebra'}
                            },
                            pronunciation: {
                                'N': '/n/ as in nest',
                                'O': '/ɒ/ as in orange',
                                'P': '/p/ as in pen',
                                'Q': '/kw/ as in queen',
                                'R': '/r/ as in rat',
                                'S': '/s/ as in sun',
                                'T': '/t/ as in tiger',
                                'U': '/ʌ/ as in umbrella',
                                'V': '/v/ as in van',
                                'W': '/w/ as in water',
                                'X': '/ks/ as in xylophone',
                                'Y': '/j/ as in yellow',
                                'Z': '/z/ as in zebra'
                            },
                            exercises: [
                                { 
                                    type: 'sequence', 
                                    question: 'What comes after N?', 
                                    options: ['O', 'M', 'P'],
                                    answer: 'O',
                                    explanation: 'The sequence is M, N, O, P...',
                                    audioText: 'O'
                                },
                                { 
                                    type: 'match', 
                                    question: 'Match Z with the correct word', 
                                    options: ['Zebra', 'Xylophone', 'Yellow'],
                                    answer: 'Zebra',
                                    explanation: 'Z is for Zebra',
                                    audioText: 'Zebra'
                                },
                                {
                                    type: 'identify',
                                    question: 'Which word starts with the letter Q?',
                                    options: ['Queen', 'Pen', 'Rat'],
                                    answer: 'Queen',
                                    explanation: 'Queen starts with Q and makes the /kw/ sound',
                                    audioText: 'Queen'
                                },
                                {
                                    type: 'pronunciation',
                                    question: 'How do you pronounce the letter X?',
                                    options: ['/ks/ as in xylophone', '/z/ as in xerox', '/ɡz/ as in exam'],
                                    answer: '/ks/ as in xylophone',
                                    explanation: 'X typically makes the /ks/ sound at the end of words',
                                    audioText: 'Xylophone'
                                }
                            ],
                            practiceWords: [
                                {word: 'Net', pronunciation: '/net/', speakText: 'Net'},
                                {word: 'Ox', pronunciation: '/ɒks/', speakText: 'Ox'},
                                {word: 'Pet', pronunciation: '/pet/', speakText: 'Pet'},
                                {word: 'Quick', pronunciation: '/kwɪk/', speakText: 'Quick'},
                                {word: 'Run', pronunciation: '/rʌn/', speakText: 'Run'},
                                {word: 'Sit', pronunciation: '/sɪt/', speakText: 'Sit'},
                                {word: 'Top', pronunciation: '/tɒp/', speakText: 'Top'},
                                {word: 'Up', pronunciation: '/ʌp/', speakText: 'Up'},
                                {word: 'Van', pronunciation: '/væn/', speakText: 'Van'},
                                {word: 'Wet', pronunciation: '/wet/', speakText: 'Wet'},
                                {word: 'Fox', pronunciation: '/fɒks/', speakText: 'Fox'},
                                {word: 'Yes', pronunciation: '/jes/', speakText: 'Yes'},
                                {word: 'Zip', pronunciation: '/zɪp/', speakText: 'Zip'}
                            ],
                            tips: [
                                'Remember that Q is almost always followed by U in English',
                                'Practice the difference between V and W sounds',
                                'X can be tricky - it often appears at the end of words'
                            ]
                        },
                        {
                            id: 'en-alpha-3',
                            title: "Alphabet Review & Writing Practice",
                            content: "Review all 26 letters with writing practice and common word formations.",
                            letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
                            examples: {
                                'A': {word: 'Apple, Ant, Arm', pronunciation: '/ˈæp.əl/, /ænt/, /ɑːrm/', speakText: 'Apple'},
                                'B': {word: 'Ball, Boy, Book', pronunciation: '/bɔːl/, /bɔɪ/, /bʊk/', speakText: 'Ball'},
                                'C': {word: 'Cat, Car, Cake', pronunciation: '/kæt/, /kɑːr/, /keɪk/', speakText: 'Cat'},
                                'D': {word: 'Dog, Door, Desk', pronunciation: '/dɒɡ/, /dɔːr/, /desk/', speakText: 'Dog'},
                                'E': {word: 'Egg, Eye, Ear', pronunciation: '/eɡ/, /aɪ/, /ɪər/', speakText: 'Egg'},
                                'F': {word: 'Fish, Fan, Food', pronunciation: '/fɪʃ/, /fæn/, /fuːd/', speakText: 'Fish'},
                                'G': {word: 'Goat, Girl, Game', pronunciation: '/ɡoʊt/, /ɡɜːrl/, /ɡeɪm/', speakText: 'Goat'},
                                'H': {word: 'Hat, House, Hand', pronunciation: '/hæt/, /haʊs/, /hænd/', speakText: 'Hat'},
                                'I': {word: 'Ice, Ink, Idea', pronunciation: '/aɪs/, /ɪŋk/, /aɪˈdɪə/', speakText: 'Ice'},
                                'J': {word: 'Jug, Jam, Jump', pronunciation: '/dʒʌɡ/, /dʒæm/, /dʒʌmp/', speakText: 'Jug'},
                                'K': {word: 'Kite, King, Key', pronunciation: '/kaɪt/, /kɪŋ/, /kiː/', speakText: 'Kite'},
                                'L': {word: 'Lion, Lamp, Leg', pronunciation: '/ˈlaɪ.ən/, /læmp/, /leɡ/', speakText: 'Lion'},
                                'M': {word: 'Monkey, Moon, Milk', pronunciation: '/ˈmʌŋ.ki/, /muːn/, /mɪlk/', speakText: 'Monkey'},
                                'N': {word: 'Nest, Nose, Night', pronunciation: '/nest/, /noʊz/, /naɪt/', speakText: 'Nest'},
                                'O': {word: 'Orange, Owl, Ocean', pronunciation: '/ˈɒr.ɪndʒ/, /aʊl/, /ˈoʊ.ʃən/', speakText: 'Orange'},
                                'P': {word: 'Pen, Pig, Park', pronunciation: '/pen/, /pɪɡ/, /pɑːrk/', speakText: 'Pen'},
                                'Q': {word: 'Queen, Quiet, Quick', pronunciation: '/kwiːn/, /ˈkwaɪ.ət/, /kwɪk/', speakText: 'Queen'},
                                'R': {word: 'Rat, Red, Rain', pronunciation: '/ræt/, /red/, /reɪn/', speakText: 'Rat'},
                                'S': {word: 'Sun, Star, School', pronunciation: '/sʌn/, /stɑːr/, /skuːl/', speakText: 'Sun'},
                                'T': {word: 'Tiger, Tree, Table', pronunciation: '/ˈtaɪ.ɡər/, /triː/, /ˈteɪ.bəl/', speakText: 'Tiger'},
                                'U': {word: 'Umbrella, Up, Under', pronunciation: '/ʌmˈbrel.ə/, /ʌp/, /ˈʌn.dər/', speakText: 'Umbrella'},
                                'V': {word: 'Van, Violet, Voice', pronunciation: '/væn/, /ˈvaɪə.lət/, /vɔɪs/', speakText: 'Van'},
                                'W': {word: 'Water, Window, Walk', pronunciation: '/ˈwɔː.tər/, /ˈwɪn.doʊ/, /wɔːk/', speakText: 'Water'},
                                'X': {word: 'Xylophone, Box, Six', pronunciation: '/ˈzaɪ.lə.foʊn/, /bɒks/, /sɪks/', speakText: 'Xylophone'},
                                'Y': {word: 'Yellow, Yes, Year', pronunciation: '/ˈjel.oʊ/, /jes/, /jɪər/', speakText: 'Yellow'},
                                'Z': {word: 'Zebra, Zoo, Zero', pronunciation: '/ˈzeb.rə/, /zuː/, /ˈzɪə.roʊ/', speakText: 'Zebra'}
                            },
                            exercises: [
                                {
                                    type: 'fill-blanks',
                                    question: 'Complete the sequence: A, B, C, _, E',
                                    options: ['D', 'F', 'G'],
                                    answer: 'D',
                                    explanation: 'The correct sequence is A, B, C, D, E',
                                    audioText: 'D'
                                },
                                {
                                    type: 'word-formation',
                                    question: 'Form a word starting with C and ending with T',
                                    options: ['Cat', 'Bat', 'Rat'],
                                    answer: 'Cat',
                                    explanation: 'C-A-T spells Cat',
                                    audioText: 'Cat'
                                },
                                {
                                    type: 'letter-sound',
                                    question: 'Which letter makes the /z/ sound?',
                                    options: ['Z', 'S', 'X'],
                                    answer: 'Z',
                                    explanation: 'Z typically makes the /z/ sound as in zebra',
                                    audioText: 'Zebra'
                                },
                                {
                                    type: 'alphabet-order',
                                    question: 'Which letter comes between P and R?',
                                    options: ['Q', 'O', 'S'],
                                    answer: 'Q',
                                    explanation: 'The order is P, Q, R, S',
                                    audioText: 'Q'
                                }
                            ],
                            practiceWords: [
                                {word: 'Apple', pronunciation: '/ˈæp.əl/', speakText: 'Apple'},
                                {word: 'Ball', pronunciation: '/bɔːl/', speakText: 'Ball'},
                                {word: 'Cat', pronunciation: '/kæt/', speakText: 'Cat'},
                                {word: 'Dog', pronunciation: '/dɒɡ/', speakText: 'Dog'},
                                {word: 'Elephant', pronunciation: '/ˈel.ɪ.fənt/', speakText: 'Elephant'},
                                {word: 'Fish', pronunciation: '/fɪʃ/', speakText: 'Fish'},
                                {word: 'Goat', pronunciation: '/ɡoʊt/', speakText: 'Goat'},
                                {word: 'House', pronunciation: '/haʊs/', speakText: 'House'},
                                {word: 'Ice', pronunciation: '/aɪs/', speakText: 'Ice'},
                                {word: 'Jump', pronunciation: '/dʒʌmp/', speakText: 'Jump'},
                                {word: 'Kite', pronunciation: '/kaɪt/', speakText: 'Kite'},
                                {word: 'Lemon', pronunciation: '/ˈlem.ən/', speakText: 'Lemon'},
                                {word: 'Monkey', pronunciation: '/ˈmʌŋ.ki/', speakText: 'Monkey'},
                                {word: 'Nest', pronunciation: '/nest/', speakText: 'Nest'},
                                {word: 'Orange', pronunciation: '/ˈɒr.ɪndʒ/', speakText: 'Orange'},
                                {word: 'Queen', pronunciation: '/kwiːn/', speakText: 'Queen'},
                                {word: 'Rabbit', pronunciation: '/ˈræb.ɪt/', speakText: 'Rabbit'},
                                {word: 'Sun', pronunciation: '/sʌn/', speakText: 'Sun'},
                                {word: 'Table', pronunciation: '/ˈteɪ.bəl/', speakText: 'Table'},
                                {word: 'Umbrella', pronunciation: '/ʌmˈbrel.ə/', speakText: 'Umbrella'},
                                {word: 'Violin', pronunciation: '/ˌvaɪəˈlɪn/', speakText: 'Violin'},
                                {word: 'Water', pronunciation: '/ˈwɔː.tər/', speakText: 'Water'},
                                {word: 'X-ray', pronunciation: '/ˈeks.reɪ/', speakText: 'X-ray'},
                                {word: 'Yellow', pronunciation: '/ˈjel.oʊ/', speakText: 'Yellow'},
                                {word: 'Zebra', pronunciation: '/ˈzeb.rə/', speakText: 'Zebra'}
                            ],
                            writingPractice: [
                                'Practice writing each letter 5 times',
                                'Write your name using the letters learned',
                                'Create simple words using the alphabet'
                            ],
                            tips: [
                                'Sing the alphabet song to remember the order',
                                'Practice both uppercase and lowercase letters',
                                'Look for letters in your environment and name them'
                            ]
                        },
                        {
                            id: 'en-alpha-4',
                            title: "Letter Sounds and Blending",
                            content: "Learn letter sounds and how to blend them to form simple words.",
                            letters: ['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G', 'H', 'L', 'M', 'N', 'P', 'R', 'S', 'T'],
                            examples: {
                                'A': {word: 'Apple, Ant, At', pronunciation: '/æ/, /æ/, /æ/', speakText: 'Apple'},
                                'E': {word: 'Egg, End, Ed', pronunciation: '/ɛ/, /ɛ/, /ɛ/', speakText: 'Egg'},
                                'I': {word: 'Igloo, In, It', pronunciation: '/ɪ/, /ɪ/, /ɪ/', speakText: 'Igloo'},
                                'O': {word: 'Octopus, On, Ox', pronunciation: '/ɒ/, /ɒ/, /ɒ/', speakText: 'Octopus'},
                                'U': {word: 'Umbrella, Up, Us', pronunciation: '/ʌ/, /ʌ/, /ʌ/', speakText: 'Umbrella'}
                            },
                            wordFamilies: [
                                {
                                    family: 'AT Family',
                                    words: ['Cat', 'Bat', 'Rat', 'Mat', 'Sat'],
                                    pronunciation: '/kæt/, /bæt/, /ræt/, /mæt/, /sæt/'
                                },
                                {
                                    family: 'EN Family',
                                    words: ['Pen', 'Ten', 'Men', 'Hen', 'Den'],
                                    pronunciation: '/pɛn/, /tɛn/, /mɛn/, /hɛn/, /dɛn/'
                                },
                                {
                                    family: 'IG Family',
                                    words: ['Pig', 'Big', 'Dig', 'Wig', 'Fig'],
                                    pronunciation: '/pɪɡ/, /bɪɡ/, /dɪɡ/, /wɪɡ/, /fɪɡ/'
                                }
                            ],
                            exercises: [
                                {
                                    type: 'sound-match',
                                    question: 'Which word starts with the /b/ sound?',
                                    options: ['Ball', 'Call', 'Tall'],
                                    answer: 'Ball',
                                    explanation: 'Ball starts with the /b/ sound',
                                    audioText: 'Ball'
                                },
                                {
                                    type: 'blending',
                                    question: 'Blend these sounds: /k/ /æ/ /t/',
                                    options: ['Cat', 'Bat', 'Rat'],
                                    answer: 'Cat',
                                    explanation: '/k/ + /æ/ + /t/ makes Cat',
                                    audioText: 'Cat'
                                },
                                {
                                    type: 'word-family',
                                    question: 'Which word belongs to the AT family?',
                                    options: ['Cat', 'Pen', 'Pig'],
                                    answer: 'Cat',
                                    explanation: 'Cat belongs to the AT word family',
                                    audioText: 'Cat'
                                }
                            ],
                            practiceWords: [
                                {word: 'Bat', pronunciation: '/bæt/', speakText: 'Bat'},
                                {word: 'Cat', pronunciation: '/kæt/', speakText: 'Cat'},
                                {word: 'Dog', pronunciation: '/dɒɡ/', speakText: 'Dog'},
                                {word: 'Fan', pronunciation: '/fæn/', speakText: 'Fan'},
                                {word: 'Hat', pronunciation: '/hæt/', speakText: 'Hat'},
                                {word: 'Jet', pronunciation: '/dʒɛt/', speakText: 'Jet'},
                                {word: 'Kit', pronunciation: '/kɪt/', speakText: 'Kit'},
                                {word: 'Lip', pronunciation: '/lɪp/', speakText: 'Lip'},
                                {word: 'Man', pronunciation: '/mæn/', speakText: 'Man'},
                                {word: 'Net', pronunciation: '/nɛt/', speakText: 'Net'}
                            ],
                            tips: [
                                'Practice sounding out each letter slowly',
                                'Blend the sounds together to form words',
                                'Use word families to learn patterns'
                            ]
                        }
                    ]
                },

                ta: {
                    title: "தமிழ் எழுத்துக்கள்",
                    lessons: [
                        {
                            id: 'ta-alpha-1',
                            title: "உயிர் எழுத்துகள் (Vowels)",
                            content: "தமிழில் உள்ள 12 உயிர் எழுத்துகளை கற்றுக்கொள்ளுங்கள். இவை தனித்தனியாக ஒலிக்கும் எழுத்துகள்.",
                            letters: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'],
                            examples: {
                                'அ': {word: 'அம்மா (Mother)', pronunciation: 'அம்மா', speakText: 'அம்மா'},
                                'ஆ': {word: 'ஆடு (Goat)', pronunciation: 'ஆடு', speakText: 'ஆடு'},
                                'இ': {word: 'இலை (Leaf)', pronunciation: 'இலை', speakText: 'இலை'},
                                'ஈ': {word: 'ஈ (Fly)', pronunciation: 'ஈ', speakText: 'ஈ'},
                                'உ': {word: 'உடல் (Body)', pronunciation: 'உடல்', speakText: 'உடல்'},
                                'ஊ': {word: 'ஊர் (Town)', pronunciation: 'ஊர்', speakText: 'ஊர்'},
                                'எ': {word: 'எலி (Rat)', pronunciation: 'எலி', speakText: 'எலி'},
                                'ஏ': {word: 'ஏணி (Ladder)', pronunciation: 'ஏணி', speakText: 'ஏணி'},
                                'ஐ': {word: 'ஐந்து (Five)', pronunciation: 'ஐந்து', speakText: 'ஐந்து'},
                                'ஒ': {word: 'ஒட்டகம் (Camel)', pronunciation: 'ஒட்டகம்', speakText: 'ஒட்டகம்'},
                                'ஓ': {word: 'ஓடம் (Boat)', pronunciation: 'ஓடம்', speakText: 'ஓடம்'},
                                'ஔ': {word: 'ஔவை (Auvaiyar - poet)', pronunciation: 'ஔவை', speakText: 'ஔவை'}
                            },
                            pronunciation: {
                                'அ': 'அ',
                                'ஆ': 'ஆ',
                                'இ': 'இ',
                                'ஈ': 'ஈ',
                                'உ': 'உ',
                                'ஊ': 'ஊ',
                                'எ': 'எ',
                                'ஏ': 'ஏ',
                                'ஐ': 'ஐ',
                                'ஒ': 'ஒ',
                                'ஓ': 'ஓ',
                                'ஔ': 'ஔ'
                            },
                            phoneticGuide: {
                                'அ': 'a (short)',
                                'ஆ': 'aa (long)',
                                'இ': 'i (short)',
                                'ஈ': 'ee (long)',
                                'உ': 'u (short)',
                                'ஊ': 'oo (long)',
                                'எ': 'e (short)',
                                'ஏ': 'ae (long)',
                                'ஐ': 'ai',
                                'ஒ': 'o (short)',
                                'ஓ': 'o (long)',
                                'ஔ': 'au'
                            },
                            exercises: [
                                { 
                                    type: 'match', 
                                    question: 'அ என்பதை சரியாக பொருத்துக', 
                                    options: ['அம்மா', 'ஆடு', 'இலை'],
                                    answer: 'அம்மா',
                                    explanation: 'அ என்ற எழுத்து அம்மா என்ற வார்த்தையில் வருகிறது',
                                    audioText: 'அம்மா'
                                },
                                { 
                                    type: 'pronounce', 
                                    question: 'இந்த எழுத்தை உச்சரிக்கவும்: ஆ', 
                                    options: ['ஆ', 'அ', 'இ'],
                                    answer: 'ஆ',
                                    explanation: 'ஆ என்ற எழுத்து நீண்ட "ஆ" ஒலியை தரும்',
                                    audioText: 'ஆ'
                                },
                                {
                                    type: 'sequence',
                                    question: 'உயிரெழுத்துகளில் அ க்கு பிறகு வருவது எது?',
                                    options: ['ஆ', 'இ', 'ஈ'],
                                    answer: 'ஆ',
                                    explanation: 'உயிரெழுத்துகளின் வரிசை: அ, ஆ, இ, ஈ, உ, ஊ, எ, ஏ, ஐ, ஒ, ஓ, ஔ',
                                    audioText: 'அ ஆ இ ஈ உ ஊ எ ஏ ஐ ஒ ஓ ஔ'
                                },
                                {
                                    type: 'identify',
                                    question: 'எலி என்ற வார்த்தையில் உள்ள உயிரெழுத்து எது?',
                                    options: ['எ', 'இ', 'ஈ'],
                                    answer: 'எ',
                                    explanation: 'எலி என்ற வார்த்தையில் "எ" என்ற உயிரெழுத்து உள்ளது',
                                    audioText: 'எலி'
                                }
                            ],
                            practiceWords: [
                                {word: 'அம்மா', pronunciation: 'அம்மா', speakText: 'அம்மா'},
                                {word: 'ஆடு', pronunciation: 'ஆடு', speakText: 'ஆடு'},
                                {word: 'இலை', pronunciation: 'இலை', speakText: 'இலை'},
                                {word: 'ஈக்கள்', pronunciation: 'ஈக்கள்', speakText: 'ஈக்கள்'},
                                {word: 'உப்பு', pronunciation: 'உப்பு', speakText: 'உப்பு'},
                                {word: 'ஊசி', pronunciation: 'ஊசி', speakText: 'ஊசி'},
                                {word: 'எலி', pronunciation: 'எலி', speakText: 'எலி'},
                                {word: 'ஏணி', pronunciation: 'ஏணி', speakText: 'ஏணி'},
                                {word: 'ஐந்து', pronunciation: 'ஐந்து', speakText: 'ஐந்து'},
                                {word: 'ஒட்டகம்', pronunciation: 'ஒட்டகம்', speakText: 'ஒட்டகம்'},
                                {word: 'ஓடம்', pronunciation: 'ஓடம்', speakText: 'ஓடம்'},
                                {word: 'ஔவை', pronunciation: 'ஔவை', speakText: 'ஔவை'}
                            ],
                            writingPractice: [
                                'ஒவ்வொரு உயிரெழுத்தையும் 5 முறை எழுதுங்கள்',
                                'உயிரெழுத்துகளை வரிசையாக எழுதுங்கள்',
                                'ஒவ்வொரு எழுத்துக்கும் இரண்டு வார்த்தைகள் எழுதுங்கள்'
                            ],
                            tips: [
                                'உயிரெழுத்துகள் தனித்தனியாக ஒலிக்கும்',
                                'ஒவ்வொரு எழுத்தின் ஒலிப்பு முறையை கவனமாக கற்றுக்கொள்ளுங்கள்',
                                'தினமும் பயிற்சி செய்யுங்கள்'
                            ]
                        },
                        {
                            id: 'ta-alpha-2',
                            title: "மெய் எழுத்துகள் (Consonants)",
                            content: "தமிழில் உள்ள 18 மெய் எழுத்துகளை கற்றுக்கொள்ளுங்கள். இவை உயிரெழுத்துடன் சேர்ந்தே ஒலிக்கும்.",
                            letters: ['க்', 'ங்', 'ச்', 'ஞ்', 'ட்', 'ண்', 'த்', 'ந்', 'ப்', 'ம்', 'ய்', 'ர்', 'ல்', 'வ்', 'ழ்', 'ள்', 'ற்', 'ன்'],
                            examples: {
                                'க்': {word: 'க', pronunciation: 'க', speakText: 'க'},
                                'ங்': {word: 'ங', pronunciation: 'ங', speakText: 'ங'},
                                'ச்': {word: 'ச', pronunciation: 'ச', speakText: 'ச'},
                                'ஞ்': {word: 'ஞ', pronunciation: 'ஞ', speakText: 'ஞ'},
                                'ட்': {word: 'ட', pronunciation: 'ட', speakText: 'ட'},
                                'ண்': {word: 'ண', pronunciation: 'ண', speakText: 'ண'},
                                'த்': {word: 'த', pronunciation: 'த', speakText: 'த'},
                                'ந்': {word: 'ந', pronunciation: 'ந', speakText: 'ந'},
                                'ப்': {word: 'ப', pronunciation: 'ப', speakText: 'ப'},
                                'ம்': {word: 'ம', pronunciation: 'ம', speakText: 'ம'},
                                'ய்': {word: 'ய', pronunciation: 'ய', speakText: 'ய'},
                                'ர்': {word: 'ர', pronunciation: 'ர', speakText: 'ர'},
                                'ல்': {word: 'ல', pronunciation: 'ல', speakText: 'ல'},
                                'வ்': {word: 'வ', pronunciation: 'வ', speakText: 'வ'},
                                'ழ்': {word: 'ழ', pronunciation: 'ழ', speakText: 'ழ'},
                                'ள்': {word: 'ள', pronunciation: 'ள', speakText: 'ள'},
                                'ற்': {word: 'ற', pronunciation: 'ற', speakText: 'ற'},
                                'ன்': {word: 'ன', pronunciation: 'ன', speakText: 'ன'}
                            },
                            pronunciation: {
                                'க்': 'க',
                                'ங்': 'ங',
                                'ச்': 'ச',
                                'ஞ்': 'ஞ',
                                'ட்': 'ட',
                                'ண்': 'ண',
                                'த்': 'த',
                                'ந்': 'ந',
                                'ப்': 'ப',
                                'ம்': 'ம',
                                'ய்': 'ய',
                                'ர்': 'ர',
                                'ல்': 'ல',
                                'வ்': 'வ',
                                'ழ்': 'ழ',
                                'ள்': 'ள',
                                'ற்': 'ற',
                                'ன்': 'ன'
                            },
                            phoneticGuide: {
                                'க்': 'ka',
                                'ங்': 'nga',
                                'ச்': 'cha',
                                'ஞ்': 'nya',
                                'ட்': 'ta (hard)',
                                'ண்': 'na (hard)',
                                'த்': 'tha',
                                'ந்': 'na',
                                'ப்': 'pa',
                                'ம்': 'ma',
                                'ய்': 'ya',
                                'ர்': 'ra',
                                'ல்': 'la',
                                'வ்': 'va',
                                'ழ்': 'zha',
                                'ள்': 'la (hard)',
                                'ற்': 'ra (hard)',
                                'ன்': 'na (soft)'
                            },
                            exercises: [
                                { 
                                    type: 'combine', 
                                    question: 'க் + அ = ?', 
                                    options: ['க', 'ச', 'ட'],
                                    answer: 'க',
                                    explanation: 'க் உடன் அ சேர்ந்து க என்று ஆகும்',
                                    audioText: 'க'
                                },
                                { 
                                    type: 'identify', 
                                    question: 'மெய் எழுத்தை கண்டறி: கடல்', 
                                    options: ['க்', 'ச்', 'ட்'],
                                    answer: 'க்',
                                    explanation: 'கடல் என்ற வார்த்தையில் க் என்ற மெய்யெழுத்து உள்ளது',
                                    audioText: 'கடல்'
                                },
                                {
                                    type: 'pronunciation',
                                    question: 'ழ் எழுத்தின் ஒலிப்பு எப்படி?',
                                    options: ['ழ', 'ல', 'ர'],
                                    answer: 'ழ',
                                    explanation: 'ழ் என்ற எழுத்து "ழ" என்ற ஒலியை தரும்',
                                    audioText: 'ழ'
                                },
                                {
                                    type: 'word-formation',
                                    question: 'ப் உடன் அ சேர்த்து எழுதுங்கள்',
                                    options: ['ப', 'ம', 'வ'],
                                    answer: 'ப',
                                    explanation: 'ப் + அ = ப',
                                    audioText: 'ப'
                                }
                            ],
                            practiceWords: [
                                {word: 'கடல்', pronunciation: 'கடல்', speakText: 'கடல்'},
                                {word: 'அங்கு', pronunciation: 'அங்கு', speakText: 'அங்கு'},
                                {word: 'செவி', pronunciation: 'செவி', speakText: 'செவி'},
                                {word: 'அஞ்சு', pronunciation: 'அஞ்சு', speakText: 'அஞ்சு'},
                                {word: 'டப்பா', pronunciation: 'டப்பா', speakText: 'டப்பா'},
                                {word: 'அணில்', pronunciation: 'அணில்', speakText: 'அணில்'},
                                {word: 'தலை', pronunciation: 'தலை', speakText: 'தலை'},
                                {word: 'நடை', pronunciation: 'நடை', speakText: 'நடை'},
                                {word: 'பல்', pronunciation: 'பல்', speakText: 'பல்'},
                                {word: 'மலை', pronunciation: 'மலை', speakText: 'மலை'},
                                {word: 'யானை', pronunciation: 'யானை', speakText: 'யானை'},
                                {word: 'ரயில்', pronunciation: 'ரயில்', speakText: 'ரயில்'},
                                {word: 'லட்டு', pronunciation: 'லட்டு', speakText: 'லட்டு'},
                                {word: 'வால்', pronunciation: 'வால்', speakText: 'வால்'},
                                {word: 'வழி', pronunciation: 'வழி', speakText: 'வழி'},
                                {word: 'வளை', pronunciation: 'வளை', speakText: 'வளை'},
                                {word: 'மறை', pronunciation: 'மறை', speakText: 'மறை'},
                                {word: 'அண்ணா', pronunciation: 'அண்ணா', speakText: 'அண்ணா'}
                            ],
                            writingPractice: [
                                'ஒவ்வொரு மெய்யெழுத்தையும் 5 முறை எழுதுங்கள்',
                                'மெய்யெழுத்துகளை உயிரெழுத்துடன் சேர்த்து எழுதுங்கள்',
                                'ஒவ்வொரு மெய்யெழுத்துக்கும் இரண்டு வார்த்தைகள் எழுதுங்கள்'
                            ],
                            tips: [
                                'மெய்யெழுத்துகள் தனியாக ஒலிக்க முடியாது',
                                'உயிரெழுத்துடன் சேர்த்தே ஒலிக்க வேண்டும்',
                                'வல்லினம், மெல்லினம், இடையினம் என வகைப்படுத்தி கற்றுக்கொள்ளுங்கள்'
                            ]
                        },
                        {
                            id: 'ta-alpha-3',
                            title: "உயிர்மெய் எழுத்துகள் (Compound Letters)",
                            content: "உயிர் மற்றும் மெய் எழுத்துகள் சேர்ந்து உருவாகும் உயிர்மெய் எழுத்துகளை கற்றுக்கொள்ளுங்கள்.",
                            letters: ['க', 'கா', 'கி', 'கீ', 'கு', 'கூ', 'கெ', 'கே', 'கை', 'கொ', 'கோ', 'கௌ'],
                            examples: {
                                'க': {word: 'கடல் (Sea)', pronunciation: 'கடல்', speakText: 'கடல்'},
                                'கா': {word: 'காற்று (Wind)', pronunciation: 'காற்று', speakText: 'காற்று'},
                                'கி': {word: 'கிண்ணம் (Bowl)', pronunciation: 'கிண்ணம்', speakText: 'கிண்ணம்'},
                                'கீ': {word: 'கீரை (Greens)', pronunciation: 'கீரை', speakText: 'கீரை'},
                                'கு': {word: 'குடம் (Pot)', pronunciation: 'குடம்', speakText: 'குடம்'},
                                'கூ': {word: 'கூடை (Basket)', pronunciation: 'கூடை', speakText: 'கூடை'},
                                'கெ': {word: 'கெட்ட (Bad)', pronunciation: 'கெட்ட', speakText: 'கெட்ட'},
                                'கே': {word: 'கேடயம் (Shield)', pronunciation: 'கேடயம்', speakText: 'கேடயம்'},
                                'கை': {word: 'கை (Hand)', pronunciation: 'கை', speakText: 'கை'},
                                'கொ': {word: 'கொடி (Flag)', pronunciation: 'கொடி', speakText: 'கொடி'},
                                'கோ': {word: 'கோழி (Chicken)', pronunciation: 'கோழி', speakText: 'கோழி'},
                                'கௌ': {word: 'கௌவை (Sore)', pronunciation: 'கௌவை', speakText: 'கௌவை'}
                            },
                            formation: {
                                'க் + அ': 'க',
                                'க் + ஆ': 'கா',
                                'க் + இ': 'கி',
                                'க் + ஈ': 'கீ',
                                'க் + உ': 'கு',
                                'க் + ஊ': 'கூ',
                                'க் + எ': 'கெ',
                                'க் + ஏ': 'கே',
                                'க் + ஐ': 'கை',
                                'க் + ஒ': 'கொ',
                                'க் + ஓ': 'கோ',
                                'க் + ஔ': 'கௌ'
                            },
                            exercises: [
                                {
                                    type: 'combine',
                                    question: 'க் + ஆ = ?',
                                    options: ['கா', 'கி', 'கு'],
                                    answer: 'கா',
                                    explanation: 'க் + ஆ = கா',
                                    audioText: 'கா'
                                },
                                {
                                    type: 'decompose',
                                    question: 'கி எப்படி உருவாகிறது?',
                                    options: ['க் + இ', 'க் + ஈ', 'ச் + இ'],
                                    answer: 'க் + இ',
                                    explanation: 'கி = க் + இ',
                                    audioText: 'கி'
                                },
                                {
                                    type: 'word-formation',
                                    question: 'கொடி என்ற வார்த்தையில் உள்ள உயிர்மெய் எழுத்து எது?',
                                    options: ['கொ', 'டி', 'கோ'],
                                    answer: 'கொ',
                                    explanation: 'கொடி என்ற வார்த்தையில் "கொ" உயிர்மெய் எழுத்து உள்ளது',
                                    audioText: 'கொடி'
                                }
                            ],
                            practiceWords: [
                                {word: 'கடல்', pronunciation: 'கடல்', speakText: 'கடல்'},
                                {word: 'காது', pronunciation: 'காது', speakText: 'காது'},
                                {word: 'கிழம்', pronunciation: 'கிழம்', speakText: 'கிழம்'},
                                {word: 'கீரை', pronunciation: 'கீரை', speakText: 'கீரை'},
                                {word: 'குழி', pronunciation: 'குழி', speakText: 'குழி'},
                                {word: 'கூடை', pronunciation: 'கூடை', speakText: 'கூடை'},
                                {word: 'கெண்டை', pronunciation: 'கெண்டை', speakText: 'கெண்டை'},
                                {word: 'கேணி', pronunciation: 'கேணி', speakText: 'கேணி'},
                                {word: 'கைப்பை', pronunciation: 'கைப்பை', speakText: 'கைப்பை'},
                                {word: 'கொடி', pronunciation: 'கொடி', speakText: 'கொடி'},
                                {word: 'கோடை', pronunciation: 'கோடை', speakText: 'கோடை'},
                                {word: 'கௌவை', pronunciation: 'கௌவை', speakText: 'கௌவை'}
                            ],
                            writingPractice: [
                                'ஒவ்வொரு உயிர்மெய் எழுத்தையும் 5 முறை எழுதுங்கள்',
                                'உயிர்மெய் எழுத்துகளை உருவாக்கும் விதிகளை பயிற்சி செய்யுங்கள்',
                                'உயிர்மெய் எழுத்துகளை கொண்ட வார்த்தைகள் எழுதுங்கள்'
                            ],
                            tips: [
                                'உயிர்மெய் எழுத்துகள் உயிர் மற்றும் மெய் எழுத்துகளின் கலவையாகும்',
                                'ஒவ்வொரு உயிர்மெய் எழுத்தும் ஒரு தனி எழுத்தாக கருதப்படும்',
                                'தமிழில் 216 உயிர்மெய் எழுத்துகள் உள்ளன'
                            ]
                        }
                    ]
                },

                hi: {
                    title: "हिंदी वर्णमाला",
                    lessons: [
                        {
                            id: 'hi-alpha-1',
                            title: "स्वर (Vowels)",
                            content: "हिंदी के 11 स्वरों को सीखें। स्वर वे ध्वनियाँ हैं जो बिना किसी अन्य ध्वनि की सहायता से बोली जा सकती हैं।",
                            letters: ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'],
                            examples: {
                                'अ': {word: 'अनार (Pomegranate)', pronunciation: 'अनार', speakText: 'अनार'},
                                'आ': {word: 'आम (Mango)', pronunciation: 'आम', speakText: 'आम'},
                                'इ': {word: 'इमली (Tamarind)', pronunciation: 'इमली', speakText: 'इमली'},
                                'ई': {word: 'ईख (Sugarcane)', pronunciation: 'ईख', speakText: 'ईख'},
                                'उ': {word: 'उल्लू (Owl)', pronunciation: 'उल्लू', speakText: 'उल्लू'},
                                'ऊ': {word: 'ऊन (Wool)', pronunciation: 'ऊन', speakText: 'ऊन'},
                                'ए': {word: 'एक (One)', pronunciation: 'एक', speakText: 'एक'},
                                'ऐ': {word: 'ऐनक (Spectacles)', pronunciation: 'ऐनक', speakText: 'ऐनक'},
                                'ओ': {word: 'ओखली (Mortar)', pronunciation: 'ओखली', speakText: 'ओखली'},
                                'औ': {word: 'और (And)', pronunciation: 'और', speakText: 'और'},
                                'अं': {word: 'अंगूर (Grapes)', pronunciation: 'अंगूर', speakText: 'अंगूर'},
                                'अः': {word: 'अः (A sacred sound)', pronunciation: 'अः', speakText: 'अः'}
                            },
                            pronunciation: {
                                'अ': 'a as in about',
                                'आ': 'aa as in father',
                                'इ': 'i as in ink',
                                'ई': 'ee as in eagle',
                                'उ': 'u as in put',
                                'ऊ': 'oo as in moon',
                                'ए': 'e as in elephant',
                                'ऐ': 'ai as in aim',
                                'ओ': 'o as in orange',
                                'औ': 'au as in out',
                                'अं': 'am as in umbrella',
                                'अः': 'aha as in aha moment'
                            },
                            exercises: [
                                { 
                                    type: 'match', 
                                    question: 'अ का उदाहरण', 
                                    options: ['अनार', 'आम', 'इमली'],
                                    answer: 'अनार',
                                    explanation: 'अ स्वर का उदाहरण अनार है',
                                    audioText: 'अनार'
                                },
                                { 
                                    type: 'write', 
                                    question: 'आ लिखें', 
                                    options: ['आ', 'इ', 'ई'],
                                    answer: 'आ',
                                    explanation: 'आ स्वर इस प्रकार लिखा जाता है',
                                    audioText: 'आ'
                                },
                                {
                                    type: 'pronunciation',
                                    question: 'ऊ का उच्चारण कैसे करें?',
                                    options: ['oo as in moon', 'u as in put', 'ee as in eagle'],
                                    answer: 'oo as in moon',
                                    explanation: 'ऊ का उच्चारण "ऊ" जैसे ऊन में होता है',
                                    audioText: 'ऊन'
                                },
                                {
                                    type: 'sequence',
                                    question: 'स्वरों में अ के बाद क्या आता है?',
                                    options: ['आ', 'इ', 'उ'],
                                    answer: 'आ',
                                    explanation: 'स्वरों का क्रम: अ, आ, इ, ई, उ, ऊ, ए, ऐ, ओ, औ, अं, अः',
                                    audioText: 'अ आ इ ई उ ऊ ए ऐ ओ औ अं अः'
                                }
                            ],
                            practiceWords: [
                                {word: 'अनार', pronunciation: 'अनार', speakText: 'अनार'},
                                {word: 'आम', pronunciation: 'आम', speakText: 'आम'},
                                {word: 'इमली', pronunciation: 'इमली', speakText: 'इमली'},
                                {word: 'ईख', pronunciation: 'ईख', speakText: 'ईख'},
                                {word: 'उल्लू', pronunciation: 'उल्लू', speakText: 'उल्लू'},
                                {word: 'ऊन', pronunciation: 'ऊन', speakText: 'ऊन'},
                                {word: 'एक', pronunciation: 'एक', speakText: 'एक'},
                                {word: 'ऐनक', pronunciation: 'ऐनक', speakText: 'ऐनक'},
                                {word: 'ओखली', pronunciation: 'ओखली', speakText: 'ओखली'},
                                {word: 'और', pronunciation: 'और', speakText: 'और'},
                                {word: 'अंगूर', pronunciation: 'अंगूर', speakText: 'अंगूर'}
                            ],
                            writingPractice: [
                                'सभी स्वरों को 5-5 बार लिखें',
                                'प्रत्येक स्वर के दो उदाहरण लिखें',
                                'स्वरों को क्रम से लिखें'
                            ],
                            tips: [
                                'स्वर स्वतंत्र रूप से बोले जा सकते हैं',
                                'हिंदी में 11 मूल स्वर होते हैं',
                                'अभ्यास करते समय उच्चारण पर ध्यान दें'
                            ]
                        },
                        {
                            id: 'hi-alpha-2',
                            title: "व्यंजन (Consonants)",
                            content: "हिंदी के 33 व्यंजनों को सीखें। व्यंजन वे ध्वनियाँ हैं जो स्वरों की सहायता से बोली जाती हैं।",
                            letters: ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह'],
                            examples: {
                                'क': {word: 'कमल (Lotus)', pronunciation: 'कमल', speakText: 'कमल'},
                                'ख': {word: 'खरगोश (Rabbit)', pronunciation: 'खरगोश', speakText: 'खरगोश'},
                                'ग': {word: 'गमला (Flowerpot)', pronunciation: 'गमला', speakText: 'गमला'},
                                'घ': {word: 'घर (House)', pronunciation: 'घर', speakText: 'घर'},
                                'च': {word: 'चाबी (Key)', pronunciation: 'चाबी', speakText: 'चाबी'},
                                'ज': {word: 'जहाज (Ship)', pronunciation: 'जहाज', speakText: 'जहाज'},
                                'ट': {word: 'टमाटर (Tomato)', pronunciation: 'टमाटर', speakText: 'टमाटर'},
                                'ड': {word: 'डमरू (Drum)', pronunciation: 'डमरू', speakText: 'डमरू'},
                                'त': {word: 'तरबूज (Watermelon)', pronunciation: 'तरबूज', speakText: 'तरबूज'},
                                'द': {word: 'दरवाजा (Door)', pronunciation: 'दरवाजा', speakText: 'दरवाजा'},
                                'प': {word: 'पतंग (Kite)', pronunciation: 'पतंग', speakText: 'पतंग'},
                                'ब': {word: 'बतख (Duck)', pronunciation: 'बतख', speakText: 'बतख'},
                                'म': {word: 'मकान (House)', pronunciation: 'मकान', speakText: 'मकान'},
                                'य': {word: 'यात्री (Traveler)', pronunciation: 'यात्री', speakText: 'यात्री'},
                                'र': {word: 'रास्ता (Road)', pronunciation: 'रास्ता', speakText: 'रास्ता'},
                                'ल': {word: 'लाल (Red)', pronunciation: 'लाल', speakText: 'लाल'},
                                'व': {word: 'वन (Forest)', pronunciation: 'वन', speakText: 'वन'},
                                'श': {word: 'शेर (Lion)', pronunciation: 'शेर', speakText: 'शेर'},
                                'स': {word: 'सब्जी (Vegetable)', pronunciation: 'सब्जी', speakText: 'सब्जी'},
                                'ह': {word: 'हाथी (Elephant)', pronunciation: 'हाथी', speakText: 'हाथी'}
                            },
                            pronunciation: {
                                'क': 'ka as in kite',
                                'ख': 'kha as in Khan',
                                'ग': 'ga as in game',
                                'घ': 'gha as in ghar',
                                'च': 'cha as in chair',
                                'ज': 'ja as in jug',
                                'ट': 'ta as in tomato',
                                'ड': 'da as in drum',
                                'त': 'ta as in water',
                                'द': 'da as in door',
                                'प': 'pa as in pan',
                                'ब': 'ba as in bat',
                                'म': 'ma as in mother',
                                'य': 'ya as in yes',
                                'र': 'ra as in run',
                                'ल': 'la as in love',
                                'व': 'va as in van',
                                'श': 'sha as in she',
                                'स': 'sa as in sun',
                                'ह': 'ha as in house'
                            },
                            exercises: [
                                {
                                    type: 'match',
                                    question: 'क का उदाहरण',
                                    options: ['कमल', 'खरगोश', 'गमला'],
                                    answer: 'कमल',
                                    explanation: 'क व्यंजन का उदाहरण कमल है',
                                    audioText: 'कमल'
                                },
                                {
                                    type: 'pronunciation',
                                    question: 'श का उच्चारण कैसे करें?',
                                    options: ['sha as in she', 'sa as in sun', 'cha as in chair'],
                                    answer: 'sha as in she',
                                    explanation: 'श का उच्चारण "श" जैसे शेर में होता है',
                                    audioText: 'शेर'
                                },
                                {
                                    type: 'categorize',
                                    question: 'कौन सा व्यंजन कंठ्य वर्ग का है?',
                                    options: ['क', 'च', 'ट'],
                                    answer: 'क',
                                    explanation: 'क, ख, ग, घ, ङ कंठ्य वर्ग के व्यंजन हैं',
                                    audioText: 'क'
                                }
                            ],
                            practiceWords: [
                                {word: 'कमल', pronunciation: 'कमल', speakText: 'कमल'},
                                {word: 'खिलौना', pronunciation: 'खिलौना', speakText: 'खिलौना'},
                                {word: 'गाजर', pronunciation: 'गाजर', speakText: 'गाजर'},
                                {word: 'चिड़िया', pronunciation: 'चिड़िया', speakText: 'चिड़िया'},
                                {word: 'जंगल', pronunciation: 'जंगल', speakText: 'जंगल'},
                                {word: 'झंडा', pronunciation: 'झंडा', speakText: 'झंडा'},
                                {word: 'टोपी', pronunciation: 'टोपी', speakText: 'टोपी'},
                                {word: 'ठंड', pronunciation: 'ठंड', speakText: 'ठंड'},
                                {word: 'डिब्बा', pronunciation: 'डिब्बा', speakText: 'डिब्बा'},
                                {word: 'तितली', pronunciation: 'तितली', speakText: 'तितली'}
                            ],
                            writingPractice: [
                                'सभी व्यंजनों को 3-3 बार लिखें',
                                'प्रत्येक व्यंजन के दो उदाहरण लिखें',
                                'व्यंजनों को वर्गों में लिखें'
                            ],
                            tips: [
                                'व्यंजनों को उच्चारण स्थान के आधार पर वर्गों में बाँटा गया है',
                                'हर व्यंजन के साथ अ स्वर माना जाता है',
                                'व्यंजनों का उच्चारण स्वरों की सहायता से होता है'
                            ]
                        }
                    ]
                },

                fr: {
                    title: "L'alphabet Français",
                    lessons: [
                        {
                            id: 'fr-alpha-1',
                            title: "A à M - Première Partie",
                            content: "Apprenez les 13 premières lettres de l'alphabet français avec la prononciation et des exemples.",
                            letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
                            examples: {
                                'A': {word: 'Arbre (Tree)', pronunciation: 'Arbre', speakText: 'Arbre'},
                                'B': {word: 'Ballon (Ball)', pronunciation: 'Ballon', speakText: 'Ballon'},
                                'C': {word: 'Chat (Cat)', pronunciation: 'Chat', speakText: 'Chat'},
                                'D': {word: 'Dent (Tooth)', pronunciation: 'Dent', speakText: 'Dent'},
                                'E': {word: 'Eau (Water)', pronunciation: 'Eau', speakText: 'Eau'},
                                'F': {word: 'Fleur (Flower)', pronunciation: 'Fleur', speakText: 'Fleur'},
                                'G': {word: 'Gâteau (Cake)', pronunciation: 'Gâteau', speakText: 'Gâteau'},
                                'H': {word: 'Hôtel (Hotel)', pronunciation: 'Hôtel', speakText: 'Hôtel'},
                                'I': {word: 'Île (Island)', pronunciation: 'Île', speakText: 'Île'},
                                'J': {word: 'Jardin (Garden)', pronunciation: 'Jardin', speakText: 'Jardin'},
                                'K': {word: 'Koala', pronunciation: 'Koala', speakText: 'Koala'},
                                'L': {word: 'Livre (Book)', pronunciation: 'Livre', speakText: 'Livre'},
                                'M': {word: 'Maison (House)', pronunciation: 'Maison', speakText: 'Maison'}
                            },
                            pronunciation: {
                                'A': 'a comme dans arbre',
                                'B': 'bé comme dans ballon',
                                'C': 'cé comme dans chat (devant a, o, u) / s (devant e, i, y)',
                                'D': 'dé comme dans dent',
                                'E': 'e comme dans eau',
                                'F': 'effe comme dans fleur',
                                'G': 'gé comme dans gâteau (devant a, o, u) / j (devant e, i, y)',
                                'H': 'hache (muette) comme dans hôtel',
                                'I': 'i comme dans île',
                                'J': 'ji comme dans jardin',
                                'K': 'ka comme dans koala',
                                'L': 'elle comme dans livre',
                                'M': 'emme comme dans maison'
                            },
                            exercises: [
                                { 
                                    type: 'match', 
                                    question: 'Associez A avec le mot correct', 
                                    options: ['Arbre', 'Ballon', 'Chat'],
                                    answer: 'Arbre',
                                    explanation: 'A est pour Arbre',
                                    audioText: 'Arbre'
                                },
                                { 
                                    type: 'pronounce', 
                                    question: 'Prononcez: Chat', 
                                    options: ['Sha', 'Ka', 'Sa'],
                                    answer: 'Sha',
                                    explanation: 'Chat se prononce "Sha" en français',
                                    audioText: 'Chat'
                                },
                                {
                                    type: 'letter-sound',
                                    question: 'Quelle lettre fait le son "j" devant e, i, y?',
                                    options: ['G', 'J', 'C'],
                                    answer: 'G',
                                    explanation: 'G fait le son "j" devant e, i, y comme dans girafe',
                                    audioText: 'Girafe'
                                },
                                {
                                    type: 'sequence',
                                    question: 'Quelle lettre vient après F?',
                                    options: ['G', 'H', 'E'],
                                    answer: 'G',
                                    explanation: 'L\'ordre est E, F, G, H, I...',
                                    audioText: 'G'
                                }
                            ],
                            practiceWords: [
                                {word: 'Arbre', pronunciation: 'Arbre', speakText: 'Arbre'},
                                {word: 'Ballon', pronunciation: 'Ballon', speakText: 'Ballon'},
                                {word: 'Chat', pronunciation: 'Chat', speakText: 'Chat'},
                                {word: 'Dent', pronunciation: 'Dent', speakText: 'Dent'},
                                {word: 'Eau', pronunciation: 'Eau', speakText: 'Eau'},
                                {word: 'Fleur', pronunciation: 'Fleur', speakText: 'Fleur'},
                                {word: 'Gâteau', pronunciation: 'Gâteau', speakText: 'Gâteau'},
                                {word: 'Hôtel', pronunciation: 'Hôtel', speakText: 'Hôtel'},
                                {word: 'Île', pronunciation: 'Île', speakText: 'Île'},
                                {word: 'Jardin', pronunciation: 'Jardin', speakText: 'Jardin'},
                                {word: 'Koala', pronunciation: 'Koala', speakText: 'Koala'},
                                {word: 'Livre', pronunciation: 'Livre', speakText: 'Livre'},
                                {word: 'Maison', pronunciation: 'Maison', speakText: 'Maison'}
                            ],
                            writingPractice: [
                                'Écrivez chaque lettre 5 fois',
                                'Pratiquez la prononciation de chaque lettre',
                                'Trouvez des mots français commençant par ces lettres'
                            ],
                            tips: [
                                'Le français a 26 lettres comme l\'anglais',
                                'La prononciation peut être différente de l\'anglais',
                                'Pratiquez les sons uniques du français'
                            ]
                        },
                        {
                            id: 'fr-alpha-2',
                            title: "N à Z - Deuxième Partie",
                            content: "Apprenez les 13 dernières lettres de l'alphabet français avec la prononciation et des exemples.",
                            letters: ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
                            examples: {
                                'N': {word: 'Nuit (Night)', pronunciation: 'Nuit', speakText: 'Nuit'},
                                'O': {word: 'Oiseau (Bird)', pronunciation: 'Oiseau', speakText: 'Oiseau'},
                                'P': {word: 'Porte (Door)', pronunciation: 'Porte', speakText: 'Porte'},
                                'Q': {word: 'Question (Question)', pronunciation: 'Question', speakText: 'Question'},
                                'R': {word: 'Rue (Street)', pronunciation: 'Rue', speakText: 'Rue'},
                                'S': {word: 'Soleil (Sun)', pronunciation: 'Soleil', speakText: 'Soleil'},
                                'T': {word: 'Table (Table)', pronunciation: 'Table', speakText: 'Table'},
                                'U': {word: 'Univers (Universe)', pronunciation: 'Univers', speakText: 'Univers'},
                                'V': {word: 'Ville (City)', pronunciation: 'Ville', speakText: 'Ville'},
                                'W': {word: 'Wagon (Wagon)', pronunciation: 'Wagon', speakText: 'Wagon'},
                                'X': {word: 'Xylophone', pronunciation: 'Xylophone', speakText: 'Xylophone'},
                                'Y': {word: 'Yoga', pronunciation: 'Yoga', speakText: 'Yoga'},
                                'Z': {word: 'Zèbre (Zebra)', pronunciation: 'Zèbre', speakText: 'Zèbre'}
                            },
                            pronunciation: {
                                'N': 'enne comme dans nuit',
                                'O': 'o comme dans oiseau',
                                'P': 'pé comme dans porte',
                                'Q': 'qu comme dans question',
                                'R': 'erre comme dans rue',
                                'S': 'esse comme dans soleil',
                                'T': 'té comme dans table',
                                'U': 'u comme dans univers',
                                'V': 'vé comme dans ville',
                                'W': 'double vé comme dans wagon',
                                'X': 'ixe comme dans xylophone',
                                'Y': 'i grec comme dans yoga',
                                'Z': 'zède comme dans zèbre'
                            },
                            exercises: [
                                {
                                    type: 'match',
                                    question: 'Associez R avec le mot correct',
                                    options: ['Rue', 'Soleil', 'Table'],
                                    answer: 'Rue',
                                    explanation: 'R est pour Rue',
                                    audioText: 'Rue'
                                },
                                {
                                    type: 'pronunciation',
                                    question: 'Comment prononce-t-on "Y" en français?',
                                    options: ['i grec', 'yé', 'ouaï'],
                                    answer: 'i grec',
                                    explanation: 'Y se prononce "i grec" en français',
                                    audioText: 'Yoga'
                                },
                                {
                                    type: 'sequence',
                                    question: 'Quelle lettre vient avant U?',
                                    options: ['T', 'S', 'V'],
                                    answer: 'T',
                                    explanation: 'L\'ordre est S, T, U, V...',
                                    audioText: 'T'
                                }
                            ],
                            practiceWords: [
                                {word: 'Nuit', pronunciation: 'Nuit', speakText: 'Nuit'},
                                {word: 'Oiseau', pronunciation: 'Oiseau', speakText: 'Oiseau'},
                                {word: 'Porte', pronunciation: 'Porte', speakText: 'Porte'},
                                {word: 'Reine', pronunciation: 'Reine', speakText: 'Reine'},
                                {word: 'Soleil', pronunciation: 'Soleil', speakText: 'Soleil'},
                                {word: 'Tigre', pronunciation: 'Tigre', speakText: 'Tigre'},
                                {word: 'Univers', pronunciation: 'Univers', speakText: 'Univers'},
                                {word: 'Vache', pronunciation: 'Vache', speakText: 'Vache'},
                                {word: 'Wagon', pronunciation: 'Wagon', speakText: 'Wagon'},
                                {word: 'Xylophone', pronunciation: 'Xylophone', speakText: 'Xylophone'},
                                {word: 'Yoga', pronunciation: 'Yoga', speakText: 'Yoga'},
                                {word: 'Zèbre', pronunciation: 'Zèbre', speakText: 'Zèbre'}
                            ],
                            writingPractice: [
                                'Écrivez chaque lettre 5 fois',
                                'Pratiquez la prononciation des lettres difficiles',
                                'Formez des mots avec les nouvelles lettres'
                            ],
                            tips: [
                                'Attention à la prononciation du R français',
                                'Le W et le Y sont rares en français',
                                'Pratiquez la liaison entre les lettres'
                            ]
                        }
                    ]
                },

                de: {
                    title: "Das Deutsche Alphabet",
                    lessons: [
                        {
                            id: 'de-alpha-1',
                            title: "A bis M - Erster Teil",
                            content: "Lernen Sie die ersten 13 Buchstaben des deutschen Alphabets mit Aussprache und Beispielen.",
                            letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
                            examples: {
                                'A': {word: 'Apfel (Apple)', pronunciation: 'Apfel', speakText: 'Apfel'},
                                'B': {word: 'Ball (Ball)', pronunciation: 'Ball', speakText: 'Ball'},
                                'C': {word: 'Computer', pronunciation: 'Computer', speakText: 'Computer'},
                                'D': {word: 'Dach (Roof)', pronunciation: 'Dach', speakText: 'Dach'},
                                'E': {word: 'Elefant (Elephant)', pronunciation: 'Elefant', speakText: 'Elefant'},
                                'F': {word: 'Fisch (Fish)', pronunciation: 'Fisch', speakText: 'Fisch'},
                                'G': {word: 'Garten (Garden)', pronunciation: 'Garten', speakText: 'Garten'},
                                'H': {word: 'Haus (House)', pronunciation: 'Haus', speakText: 'Haus'},
                                'I': {word: 'Insel (Island)', pronunciation: 'Insel', speakText: 'Insel'},
                                'J': {word: 'Jahr (Year)', pronunciation: 'Jahr', speakText: 'Jahr'},
                                'K': {word: 'Katze (Cat)', pronunciation: 'Katze', speakText: 'Katze'},
                                'L': {word: 'Löwe (Lion)', pronunciation: 'Löwe', speakText: 'Löwe'},
                                'M': {word: 'Mond (Moon)', pronunciation: 'Mond', speakText: 'Mond'}
                            },
                            pronunciation: {
                                'A': 'a wie in Apfel',
                                'B': 'be wie in Ball',
                                'C': 'tse wie in Computer',
                                'D': 'de wie in Dach',
                                'E': 'e wie in Elefant',
                                'F': 'ef wie in Fisch',
                                'G': 'ge wie in Garten',
                                'H': 'ha wie in Haus',
                                'I': 'i wie in Insel',
                                'J': 'jot wie in Jahr',
                                'K': 'ka wie in Katze',
                                'L': 'el wie in Löwe',
                                'M': 'em wie in Mond'
                            },
                            exercises: [
                                { 
                                    type: 'match', 
                                    question: 'Verbinde A mit', 
                                    options: ['Apfel', 'Ball', 'Computer'],
                                    answer: 'Apfel',
                                    explanation: 'A steht für Apfel',
                                    audioText: 'Apfel'
                                },
                                { 
                                    type: 'pronounce', 
                                    question: 'Sprich aus: Elefant', 
                                    options: ['Eh-leh-fant', 'E-le-fant', 'El-e-fant'],
                                    answer: 'Eh-leh-fant',
                                    explanation: 'Elefant wird "Eh-leh-fant" ausgesprochen',
                                    audioText: 'Elefant'
                                },
                                {
                                    type: 'letter-sound',
                                    question: 'Welcher Buchstabe wird "tse" ausgesprochen?',
                                    options: ['C', 'Z', 'K'],
                                    answer: 'C',
                                    explanation: 'C wird "tse" ausgesprochen wie in Computer',
                                    audioText: 'Computer'
                                },
                                {
                                    type: 'sequence',
                                    question: 'Welcher Buchstabe kommt nach F?',
                                    options: ['G', 'H', 'E'],
                                    answer: 'G',
                                    explanation: 'Die Reihenfolge ist E, F, G, H, I...',
                                    audioText: 'G'
                                }
                            ],
                            practiceWords: [
                                {word: 'Apfel', pronunciation: 'Apfel', speakText: 'Apfel'},
                                {word: 'Ball', pronunciation: 'Ball', speakText: 'Ball'},
                                {word: 'Computer', pronunciation: 'Computer', speakText: 'Computer'},
                                {word: 'Dach', pronunciation: 'Dach', speakText: 'Dach'},
                                {word: 'Elefant', pronunciation: 'Elefant', speakText: 'Elefant'},
                                {word: 'Fisch', pronunciation: 'Fisch', speakText: 'Fisch'},
                                {word: 'Garten', pronunciation: 'Garten', speakText: 'Garten'},
                                {word: 'Haus', pronunciation: 'Haus', speakText: 'Haus'},
                                {word: 'Insel', pronunciation: 'Insel', speakText: 'Insel'},
                                {word: 'Jahr', pronunciation: 'Jahr', speakText: 'Jahr'},
                                {word: 'Katze', pronunciation: 'Katze', speakText: 'Katze'},
                                {word: 'Löwe', pronunciation: 'Löwe', speakText: 'Löwe'},
                                {word: 'Mond', pronunciation: 'Mond', speakText: 'Mond'}
                            ],
                            writingPractice: [
                                'Schreiben Sie jeden Buchstaben 5 mal',
                                'Üben Sie die Aussprache jedes Buchstabens',
                                'Finden Sie deutsche Wörter mit diesen Buchstaben'
                            ],
                            tips: [
                                'Das deutsche Alphabet hat 26 Buchstaben wie Englisch',
                                'Die Aussprache ist oft regelmäßiger als im Englischen',
                                'Üben Sie die deutschen Umlaute separat'
                            ]
                        },
                        {
                            id: 'de-alpha-2',
                            title: "N bis Z - Zweiter Teil",
                            content: "Lernen Sie die letzten 13 Buchstaben des deutschen Alphabets mit Aussprache und Beispielen.",
                            letters: ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
                            examples: {
                                'N': {word: 'Nase (Nose)', pronunciation: 'Nase', speakText: 'Nase'},
                                'O': {word: 'Orange (Orange)', pronunciation: 'Orange', speakText: 'Orange'},
                                'P': {word: 'Pferd (Horse)', pronunciation: 'Pferd', speakText: 'Pferd'},
                                'Q': {word: 'Qualle (Jellyfish)', pronunciation: 'Qualle', speakText: 'Qualle'},
                                'R': {word: 'Rose (Rose)', pronunciation: 'Rose', speakText: 'Rose'},
                                'S': {word: 'Sonne (Sun)', pronunciation: 'Sonne', speakText: 'Sonne'},
                                'T': {word: 'Tiger (Tiger)', pronunciation: 'Tiger', speakText: 'Tiger'},
                                'U': {word: 'Uhr (Clock)', pronunciation: 'Uhr', speakText: 'Uhr'},
                                'V': {word: 'Vogel (Bird)', pronunciation: 'Vogel', speakText: 'Vogel'},
                                'W': {word: 'Wasser (Water)', pronunciation: 'Wasser', speakText: 'Wasser'},
                                'X': {word: 'Xylophon', pronunciation: 'Xylophon', speakText: 'Xylophon'},
                                'Y': {word: 'Yoga', pronunciation: 'Yoga', speakText: 'Yoga'},
                                'Z': {word: 'Zebra', pronunciation: 'Zebra', speakText: 'Zebra'}
                            },
                            pronunciation: {
                                'N': 'en wie in Nase',
                                'O': 'o wie in Orange',
                                'P': 'pe wie in Pferd',
                                'Q': 'ku wie in Qualle',
                                'R': 'er wie in Rose',
                                'S': 'es wie in Sonne',
                                'T': 'te wie in Tiger',
                                'U': 'u wie in Uhr',
                                'V': 'fau wie in Vogel',
                                'W': 'we wie in Wasser',
                                'X': 'iks wie in Xylophon',
                                'Y': 'ypsilon wie in Yoga',
                                'Z': 'zet wie in Zebra'
                            },
                            exercises: [
                                {
                                    type: 'match',
                                    question: 'Verbinde S mit',
                                    options: ['Sonne', 'Rose', 'Tiger'],
                                    answer: 'Sonne',
                                    explanation: 'S steht für Sonne',
                                    audioText: 'Sonne'
                                },
                                {
                                    type: 'pronunciation',
                                    question: 'Wie spricht man "V" aus?',
                                    options: ['fau', 'we', 've'],
                                    answer: 'fau',
                                    explanation: 'V wird "fau" ausgesprochen wie in Vogel',
                                    audioText: 'Vogel'
                                },
                                {
                                    type: 'sequence',
                                    question: 'Welcher Buchstabe kommt vor U?',
                                    options: ['T', 'S', 'V'],
                                    answer: 'T',
                                    explanation: 'Die Reihenfolge ist S, T, U, V...',
                                    audioText: 'T'
                                }
                            ],
                            practiceWords: [
                                {word: 'Nase', pronunciation: 'Nase', speakText: 'Nase'},
                                {word: 'Orange', pronunciation: 'Orange', speakText: 'Orange'},
                                {word: 'Pferd', pronunciation: 'Pferd', speakText: 'Pferd'},
                                {word: 'Qualle', pronunciation: 'Qualle', speakText: 'Qualle'},
                                {word: 'Rose', pronunciation: 'Rose', speakText: 'Rose'},
                                {word: 'Sonne', pronunciation: 'Sonne', speakText: 'Sonne'},
                                {word: 'Tiger', pronunciation: 'Tiger', speakText: 'Tiger'},
                                {word: 'Uhr', pronunciation: 'Uhr', speakText: 'Uhr'},
                                {word: 'Vogel', pronunciation: 'Vogel', speakText: 'Vogel'},
                                {word: 'Wasser', pronunciation: 'Wasser', speakText: 'Wasser'},
                                {word: 'Xylophon', pronunciation: 'Xylophon', speakText: 'Xylophon'},
                                {word: 'Yoga', pronunciation: 'Yoga', speakText: 'Yoga'},
                                {word: 'Zebra', pronunciation: 'Zebra', speakText: 'Zebra'}
                            ],
                            writingPractice: [
                                'Schreiben Sie jeden Buchstaben 5 mal',
                                'Üben Sie die schwierigen Buchstaben',
                                'Bilden Sie Wörter mit den neuen Buchstaben'
                            ],
                            tips: [
                                'Beachten Sie die Aussprache von V und W',
                                'Q wird immer mit U verwendet',
                                'X, Y, Z sind seltenere Buchstaben im Deutschen'
                            ]
                        }
                    ]
                }
            },

            // VOCABULARY MODULE (Updated with pronunciations)
            vocabulary: {
                en: {
                    title: "English Vocabulary",
                    lessons: [
                        {
                            id: 'en-vocab-1',
                            title: "Common Greetings and Basic Phrases",
                            content: "Learn essential greeting phrases and basic expressions in English for everyday communication.",
                            words: [
                                { 
                                    word: 'Hello', 
                                    meaning: 'A greeting used when meeting someone', 
                                    example: 'Hello, how are you?',
                                    pronunciation: '/həˈloʊ/',
                                    synonyms: ['Hi', 'Hey'],
                                    speakText: 'Hello'
                                },
                                { 
                                    word: 'Goodbye', 
                                    meaning: 'Farewell, said when leaving', 
                                    example: 'Goodbye, see you later!',
                                    pronunciation: '/ɡʊdˈbaɪ/',
                                    synonyms: ['Bye', 'See you'],
                                    speakText: 'Goodbye'
                                },
                                { 
                                    word: 'Please', 
                                    meaning: 'Polite word used when making a request', 
                                    example: 'Please help me.',
                                    pronunciation: '/pliːz/',
                                    synonyms: ['Kindly'],
                                    speakText: 'Please'
                                },
                                { 
                                    word: 'Thank you', 
                                    meaning: 'Expression of gratitude', 
                                    example: 'Thank you for your help.',
                                    pronunciation: '/ˈθæŋk juː/',
                                    synonyms: ['Thanks', 'Much obliged'],
                                    speakText: 'Thank you'
                                },
                                { 
                                    word: 'Sorry', 
                                    meaning: 'Expression of apology', 
                                    example: 'I am sorry for being late.',
                                    pronunciation: '/ˈsɑːri/',
                                    synonyms: ['Apologies', 'My bad'],
                                    speakText: 'Sorry'
                                },
                                { 
                                    word: 'Yes', 
                                    meaning: 'Affirmative response', 
                                    example: 'Yes, I understand.',
                                    pronunciation: '/jɛs/',
                                    synonyms: ['Yeah', 'Sure'],
                                    speakText: 'Yes'
                                },
                                { 
                                    word: 'No', 
                                    meaning: 'Negative response', 
                                    example: 'No, thank you.',
                                    pronunciation: '/noʊ/',
                                    synonyms: ['Nope', 'Nah'],
                                    speakText: 'No'
                                }
                            ],
                            phrases: [
                                {phrase: 'How are you?', meaning: 'Used to ask about someone\'s well-being', pronunciation: '/haʊ ɑːr juː/', speakText: 'How are you'},
                                {phrase: 'What is your name?', meaning: 'Used to ask someone\'s name', pronunciation: '/wʌt ɪz jɔːr neɪm/', speakText: 'What is your name'},
                                {phrase: 'My name is...', meaning: 'Used to introduce yourself', pronunciation: '/maɪ neɪm ɪz/', speakText: 'My name is'},
                                {phrase: 'Nice to meet you', meaning: 'Polite expression when meeting someone', pronunciation: '/naɪs tə miːt juː/', speakText: 'Nice to meet you'},
                                {phrase: 'Excuse me', meaning: 'Used to get attention or apologize', pronunciation: '/ɪkˈskjuːz miː/', speakText: 'Excuse me'}
                            ],
                            exercises: [
                                { 
                                    type: 'fill', 
                                    question: '____ you for your help.', 
                                    options: ['Thank', 'Please', 'Hello'],
                                    answer: 'Thank',
                                    explanation: 'The correct phrase is "Thank you for your help."',
                                    audioText: 'Thank you for your help'
                                },
                                { 
                                    type: 'translate', 
                                    question: 'How do you greet someone in English?', 
                                    options: ['Hello', 'Goodbye', 'Sorry'],
                                    answer: 'Hello',
                                    explanation: 'Hello is the standard greeting in English',
                                    audioText: 'Hello'
                                },
                                {
                                    type: 'match',
                                    question: 'Match "Please" with its meaning',
                                    options: ['Polite request', 'Farewell', 'Gratitude'],
                                    answer: 'Polite request',
                                    explanation: 'Please is used to make polite requests',
                                    audioText: 'Please'
                                },
                                {
                                    type: 'sentence-formation',
                                    question: 'Form a polite request using "please"',
                                    options: ['Please help me', 'Hello help me', 'Thank you help me'],
                                    answer: 'Please help me',
                                    explanation: '"Please help me" is a polite way to ask for assistance',
                                    audioText: 'Please help me'
                                }
                            ],
                            practiceDialogs: [
                                {
                                    personA: {text: 'Hello, how are you?', pronunciation: '/həˈloʊ, haʊ ɑːr juː/', speakText: 'Hello, how are you'},
                                    personB: {text: 'I\'m fine, thank you. And you?', pronunciation: '/aɪm faɪn, ˈθæŋk juː. ænd juː/', speakText: 'I\'m fine, thank you. And you'}
                                },
                                {
                                    personA: {text: 'What is your name?', pronunciation: '/wʌt ɪz jɔːr neɪm/', speakText: 'What is your name'},
                                    personB: {text: 'My name is John. Nice to meet you.', pronunciation: '/maɪ neɪm ɪz dʒɒn. naɪs tə miːt juː/', speakText: 'My name is John. Nice to meet you'}
                                },
                                {
                                    personA: {text: 'Excuse me, can you help me?', pronunciation: '/ɪkˈskjuːz miː, kæn juː hɛlp miː/', speakText: 'Excuse me, can you help me'},
                                    personB: {text: 'Yes, of course. How can I help you?', pronunciation: '/jɛs, əv kɔːrs. haʊ kæn aɪ hɛlp juː/', speakText: 'Yes, of course. How can I help you'}
                                }
                            ],
                            culturalNotes: [
                                'In English-speaking countries, people often greet with a handshake or smile',
                                '"How are you?" is often used as a greeting, not a serious inquiry about health',
                                'Saying "please" and "thank you" is considered very important in English culture'
                            ]
                        },
                        {
                            id: 'en-vocab-2',
                            title: "Numbers and Colors",
                            content: "Learn numbers from 1-20 and basic colors in English with pronunciation practice.",
                            words: [
                                {
                                    word: 'One',
                                    meaning: 'The number 1',
                                    example: 'I have one apple.',
                                    pronunciation: '/wʌn/',
                                    synonyms: ['Single'],
                                    speakText: 'One'
                                },
                                {
                                    word: 'Two',
                                    meaning: 'The number 2',
                                    example: 'Two birds are singing.',
                                    pronunciation: '/tuː/',
                                    synonyms: ['Pair'],
                                    speakText: 'Two'
                                },
                                {
                                    word: 'Three',
                                    meaning: 'The number 3',
                                    example: 'Three little pigs.',
                                    pronunciation: '/θriː/',
                                    synonyms: ['Triple'],
                                    speakText: 'Three'
                                },
                                {
                                    word: 'Red',
                                    meaning: 'Color of blood or fire',
                                    example: 'The apple is red.',
                                    pronunciation: '/rɛd/',
                                    synonyms: ['Crimson', 'Scarlet'],
                                    speakText: 'Red'
                                },
                                {
                                    word: 'Blue',
                                    meaning: 'Color of the sky or ocean',
                                    example: 'The sky is blue.',
                                    pronunciation: '/bluː/',
                                    synonyms: ['Azure', 'Navy'],
                                    speakText: 'Blue'
                                },
                                {
                                    word: 'Green',
                                    meaning: 'Color of grass or leaves',
                                    example: 'The grass is green.',
                                    pronunciation: '/ɡriːn/',
                                    synonyms: ['Emerald', 'Lime'],
                                    speakText: 'Green'
                                },
                                {
                                    word: 'Yellow',
                                    meaning: 'Color of the sun or bananas',
                                    example: 'The sun is yellow.',
                                    pronunciation: '/ˈjɛloʊ/',
                                    synonyms: ['Gold', 'Lemon'],
                                    speakText: 'Yellow'
                                }
                            ],
                            numbers: [
                                {number: '1', word: 'One', pronunciation: '/wʌn/', speakText: 'One'},
                                {number: '2', word: 'Two', pronunciation: '/tuː/', speakText: 'Two'},
                                {number: '3', word: 'Three', pronunciation: '/θriː/', speakText: 'Three'},
                                {number: '4', word: 'Four', pronunciation: '/fɔːr/', speakText: 'Four'},
                                {number: '5', word: 'Five', pronunciation: '/faɪv/', speakText: 'Five'},
                                {number: '6', word: 'Six', pronunciation: '/sɪks/', speakText: 'Six'},
                                {number: '7', word: 'Seven', pronunciation: '/ˈsɛvən/', speakText: 'Seven'},
                                {number: '8', word: 'Eight', pronunciation: '/eɪt/', speakText: 'Eight'},
                                {number: '9', word: 'Nine', pronunciation: '/naɪn/', speakText: 'Nine'},
                                {number: '10', word: 'Ten', pronunciation: '/tɛn/', speakText: 'Ten'}
                            ],
                            colors: [
                                {color: 'Red', pronunciation: '/rɛd/', speakText: 'Red'},
                                {color: 'Blue', pronunciation: '/bluː/', speakText: 'Blue'},
                                {color: 'Green', pronunciation: '/ɡriːn/', speakText: 'Green'},
                                {color: 'Yellow', pronunciation: '/ˈjɛloʊ/', speakText: 'Yellow'},
                                {color: 'Orange', pronunciation: '/ˈɔːrɪndʒ/', speakText: 'Orange'},
                                {color: 'Purple', pronunciation: '/ˈpɜːrpl/', speakText: 'Purple'},
                                {color: 'Black', pronunciation: '/blæk/', speakText: 'Black'},
                                {color: 'White', pronunciation: '/waɪt/', speakText: 'White'},
                                {color: 'Brown', pronunciation: '/braʊn/', speakText: 'Brown'},
                                {color: 'Pink', pronunciation: '/pɪŋk/', speakText: 'Pink'}
                            ],
                            exercises: [
                                {
                                    type: 'count',
                                    question: 'Count from 1 to 5',
                                    options: ['One, Two, Three, Four, Five', 'Five, Four, Three, Two, One', 'Two, Three, Four, Five, Six'],
                                    answer: 'One, Two, Three, Four, Five',
                                    explanation: 'The correct counting order is One, Two, Three, Four, Five',
                                    audioText: 'One Two Three Four Five'
                                },
                                {
                                    type: 'color-identification',
                                    question: 'What color is the sky?',
                                    options: ['Blue', 'Red', 'Green'],
                                    answer: 'Blue',
                                    explanation: 'The sky is typically blue during the day',
                                    audioText: 'Blue'
                                },
                                {
                                    type: 'number-word',
                                    question: 'What number comes after three?',
                                    options: ['Four', 'Two', 'Five'],
                                    answer: 'Four',
                                    explanation: 'The sequence is One, Two, Three, Four, Five...',
                                    audioText: 'Four'
                                }
                            ],
                            practiceSentences: [
                                'I see three red apples.',
                                'The sky is blue and the grass is green.',
                                'I have five yellow pencils.',
                                'She has two black cats.',
                                'We need seven white papers.'
                            ],
                            tips: [
                                'Practice counting objects around you',
                                'Name the colors of things you see daily',
                                'Use numbers and colors together in sentences'
                            ]
                        }
                    ]
                },

                ta: {
                    title: "தமிழ் சொல்வளம்",
                    lessons: [
                        {
                            id: 'ta-vocab-1',
                            title: "அடிப்படை வாழ்த்துகள் மற்றும் சொற்கள்",
                            content: "அன்றாட தேவைக்கான அடிப்படை வாழ்த்து சொற்கள் மற்றும் வார்த்தைகளை கற்றுக்கொள்ளுங்கள்.",
                            words: [
                                { 
                                    word: 'வணக்கம்', 
                                    meaning: 'Hello/Greetings', 
                                    example: 'வணக்கம், எப்படி இருக்கிறீர்கள்?',
                                    pronunciation: 'வணக்கம்',
                                    synonyms: ['நமஸ்காரம்'],
                                    speakText: 'வணக்கம்'
                                },
                                { 
                                    word: 'நன்றி', 
                                    meaning: 'Thank you', 
                                    example: 'உங்கள் உதவிக்கு நன்றி.',
                                    pronunciation: 'நன்றி',
                                    synonyms: ['ரொம்ப நன்றி'],
                                    speakText: 'நன்றி'
                                },
                                { 
                                    word: 'தயவு செய்து', 
                                    meaning: 'Please', 
                                    example: 'தயவு செய்து எனக்கு உதவுங்கள்.',
                                    pronunciation: 'தயவு செய்து',
                                    synonyms: ['தாங்கள்'],
                                    speakText: 'தயவு செய்து'
                                },
                                { 
                                    word: 'பொறுங்கள்', 
                                    meaning: 'Wait/Excuse me', 
                                    example: 'பொறுங்கள், சற்று நேரம்.',
                                    pronunciation: 'பொறுங்கள்',
                                    synonyms: ['காத்திருங்கள்'],
                                    speakText: 'பொறுங்கள்'
                                },
                                { 
                                    word: 'மன்னிக்கணும்', 
                                    meaning: 'Sorry', 
                                    example: 'தாமதத்திற்கு மன்னிக்கணும்.',
                                    pronunciation: 'மன்னிக்கணும்',
                                    synonyms: ['क्षमा करें'],
                                    speakText: 'மன்னிக்கணும்'
                                },
                                { 
                                    word: 'ஆமாம்', 
                                    meaning: 'Yes', 
                                    example: 'ஆமாம், புரிந்த்துக்கொண்டேன்.',
                                    pronunciation: 'ஆமாம்',
                                    synonyms: ['ஓ'],
                                    speakText: 'ஆமாம்'
                                },
                                { 
                                    word: 'இல்லை', 
                                    meaning: 'No', 
                                    example: 'இல்லை, தெரியாது.',
                                    pronunciation: 'இல்லை',
                                    synonyms: ['வேண்டாம்'],
                                    speakText: 'இல்லை'
                                }
                            ],
                            phrases: [
                                {phrase: 'எப்படி இருக்கிறீர்கள்?', meaning: 'How are you?', pronunciation: 'எப்படி இருக்கிறீர்கள்', speakText: 'எப்படி இருக்கிறீர்கள்'},
                                {phrase: 'உங்கள் பெயர் என்ன?', meaning: 'What is your name?', pronunciation: 'உங்கள் பெயர் என்ன', speakText: 'உங்கள் பெயர் என்ன'},
                                {phrase: 'என் பெயர்...', meaning: 'My name is...', pronunciation: 'என் பெயர்', speakText: 'என் பெயர்'},
                                {phrase: 'உங்களை சந்தித்ததில் மகிழ்ச்சி', meaning: 'Nice to meet you', pronunciation: 'உங்களை சந்தித்ததில் மகிழ்ச்சி', speakText: 'உங்களை சந்தித்ததில் மகிழ்ச்சி'},
                                {phrase: 'என்னை மன்னிக்கவும்', meaning: 'Excuse me', pronunciation: 'என்னை மன்னிக்கவும்', speakText: 'என்னை மன்னிக்கவும்'}
                            ],
                            exercises: [
                                { 
                                    type: 'match', 
                                    question: 'வணக்கம் என்றால் என்ன?', 
                                    options: ['Hello', 'Thank you', 'Sorry'],
                                    answer: 'Hello',
                                    explanation: 'வணக்கம் என்பது ஹலோ/வாழ்த்து என்று பொருள்',
                                    audioText: 'வணக்கம்'
                                },
                                { 
                                    type: 'fill', 
                                    question: 'உதவிக்கு ____', 
                                    options: ['நன்றி', 'வணக்கம்', 'மன்னிக்கணும்'],
                                    answer: 'நன்றி',
                                    explanation: 'உதவிக்கு நன்றி என்று சொல்வது சரி',
                                    audioText: 'நன்றி'
                                },
                                {
                                    type: 'sentence-formation',
                                    question: '"Please help me" என்பதை தமிழில் சொல்லுங்கள்',
                                    options: ['தயவு செய்து எனக்கு உதவுங்கள்', 'வணக்கம் உதவுங்கள்', 'நன்றி உதவுங்கள்'],
                                    answer: 'தயவு செய்து எனக்கு உதவுங்கள்',
                                    explanation: 'தயவு செய்து எனக்கு உதவுங்கள் என்பது சரியான வாக்கியம்',
                                    audioText: 'தயவு செய்து எனக்கு உதவுங்கள்'
                                },
                                {
                                    type: 'translation',
                                    question: 'How do you say "Yes" in Tamil?',
                                    options: ['ஆமாம்', 'இல்லை', 'நன்றி'],
                                    answer: 'ஆமாம்',
                                    explanation: 'Yes என்பதற்கு ஆமாம் என்று தமிழில் சொல்வார்கள்',
                                    audioText: 'ஆமாம்'
                                }
                            ],
                            practiceDialogs: [
                                {
                                    personA: {text: 'வணக்கம், எப்படி இருக்கிறீர்கள்?', pronunciation: 'வணக்கம், எப்படி இருக்கிறீர்கள்', speakText: 'வணக்கம், எப்படி இருக்கிறீர்கள்'},
                                    personB: {text: 'நன்றாக இருக்கிறேன், நன்றி. நீங்கள்?', pronunciation: 'நன்றாக இருக்கிறேன், நன்றி. நீங்கள்', speakText: 'நன்றாக இருக்கிறேன், நன்றி. நீங்கள்'}
                                },
                                {
                                    personA: {text: 'உங்கள் பெயர் என்ன?', pronunciation: 'உங்கள் பெயர் என்ன', speakText: 'உங்கள் பெயர் என்ன'},
                                    personB: {text: 'என் பெயர் ராஜ். உங்களை சந்தித்ததில் மகிழ்ச்சி.', pronunciation: 'என் பெயர் ராஜ். உங்களை சந்தித்ததில் மகிழ்ச்சி', speakText: 'என் பெயர் ராஜ். உங்களை சந்தித்ததில் மகிழ்ச்சி'}
                                },
                                {
                                    personA: {text: 'என்னை மன்னிக்கவும், எனக்கு உதவ முடியுமா?', pronunciation: 'என்னை மன்னிக்கவும், எனக்கு உதவ முடியுமா', speakText: 'என்னை மன்னிக்கவும், எனக்கு உதவ முடியுமா'},
                                    personB: {text: 'ஆமாம், நிச்சயமாக. எப்படி உதவ வேண்டும்?', pronunciation: 'ஆமாம், நிச்சயமாக. எப்படி உதவ வேண்டும்', speakText: 'ஆமாம், நிச்சயமாக. எப்படி உதவ வேண்டும்'}
                                }
                            ],
                            culturalNotes: [
                                'தமிழர்கள் வணக்கம் சொல்லும் போது கைகூப்பி வணங்குவது வழக்கம்',
                                'பெரியவர்களை "ஐயா/அம்மா" என்று அழைப்பது மரியாதைக்குரியது',
                                'நன்றி சொல்வது முக்கியமான பண்பாடு'
                            ]
                        },
                        {
                            id: 'ta-vocab-2',
                            title: "எண்கள் மற்றும் நிறங்கள்",
                            content: "1-20 வரை எண்கள் மற்றும் அடிப்படை நிறங்களை தமிழில் கற்றுக்கொள்ளுங்கள்.",
                            words: [
                                {
                                    word: 'ஒன்று',
                                    meaning: 'எண் 1',
                                    example: 'என்னிடம் ஒரு ஆப்பிள் உள்ளது.',
                                    pronunciation: 'ஒன்று',
                                    synonyms: ['ஒரு'],
                                    speakText: 'ஒன்று'
                                },
                                {
                                    word: 'இரண்டு',
                                    meaning: 'எண் 2',
                                    example: 'இரண்டு பறவைகள் பாடுகின்றன.',
                                    pronunciation: 'இரண்டு',
                                    synonyms: ['இரண்டும்'],
                                    speakText: 'இரண்டு'
                                },
                                {
                                    word: 'மூன்று',
                                    meaning: 'எண் 3',
                                    example: 'மூன்று சிறு பன்றிகள்.',
                                    pronunciation: 'மூன்று',
                                    synonyms: ['மூவர்'],
                                    speakText: 'மூன்று'
                                },
                                {
                                    word: 'சிவப்பு',
                                    meaning: 'இரத்தம் அல்லது தீயின் நிறம்',
                                    example: 'ஆப்பிள் சிவப்பு நிறத்தில் உள்ளது.',
                                    pronunciation: 'சிவப்பு',
                                    synonyms: ['செம்மை'],
                                    speakText: 'சிவப்பு'
                                },
                                {
                                    word: 'நீலம்',
                                    meaning: 'வானம் அல்லது கடலின் நிறம்',
                                    example: 'வானம் நீல நிறத்தில் உள்ளது.',
                                    pronunciation: 'நீலம்',
                                    synonyms: ['அழகி'],
                                    speakText: 'நீலம்'
                                },
                                {
                                    word: 'பச்சை',
                                    meaning: 'புல் அல்லது இலைகளின் நிறம்',
                                    example: 'புல் பச்சை நிறத்தில் உள்ளது.',
                                    pronunciation: 'பச்சை',
                                    synonyms: ['கொடி'],
                                    speakText: 'பச்சை'
                                },
                                {
                                    word: 'மஞ்சள்',
                                    meaning: 'சூரியன் அல்லது வாழைப்பழத்தின் நிறம்',
                                    example: 'சூரியன் மஞ்சள் நிறத்தில் உள்ளது.',
                                    pronunciation: 'மஞ்சள்',
                                    synonyms: ['மஞ்சள்'],
                                    speakText: 'மஞ்சள்'
                                }
                            ],
                            numbers: [
                                {number: '1', word: 'ஒன்று', pronunciation: 'ஒன்று', speakText: 'ஒன்று'},
                                {number: '2', word: 'இரண்டு', pronunciation: 'இரண்டு', speakText: 'இரண்டு'},
                                {number: '3', word: 'மூன்று', pronunciation: 'மூன்று', speakText: 'மூன்று'},
                                {number: '4', word: 'நான்கு', pronunciation: 'நான்கு', speakText: 'நான்கு'},
                                {number: '5', word: 'ஐந்து', pronunciation: 'ஐந்து', speakText: 'ஐந்து'},
                                {number: '6', word: 'ஆறு', pronunciation: 'ஆறு', speakText: 'ஆறு'},
                                {number: '7', word: 'ஏழு', pronunciation: 'ஏழு', speakText: 'ஏழு'},
                                {number: '8', word: 'எட்டு', pronunciation: 'எட்டு', speakText: 'எட்டு'},
                                {number: '9', word: 'ஒன்பது', pronunciation: 'ஒன்பது', speakText: 'ஒன்பது'},
                                {number: '10', word: 'பத்து', pronunciation: 'பத்து', speakText: 'பத்து'}
                            ],
                            colors: [
                                {color: 'சிவப்பு', pronunciation: 'சிவப்பு', speakText: 'சிவப்பு'},
                                {color: 'நீலம்', pronunciation: 'நீலம்', speakText: 'நீலம்'},
                                {color: 'பச்சை', pronunciation: 'பச்சை', speakText: 'பச்சை'},
                                {color: 'மஞ்சள்', pronunciation: 'மஞ்சள்', speakText: 'மஞ்சள்'},
                                {color: 'ஆரஞ்சு', pronunciation: 'ஆரஞ்சு', speakText: 'ஆரஞ்சு'},
                                {color: 'ஊதா', pronunciation: 'ஊதா', speakText: 'ஊதா'},
                                {color: 'கருப்பு', pronunciation: 'கருப்பு', speakText: 'கருப்பு'},
                                {color: 'வெள்ளை', pronunciation: 'வெள்ளை', speakText: 'வெள்ளை'},
                                {color: 'பழுப்பு', pronunciation: 'பழுப்பு', speakText: 'பழுப்பு'},
                                {color: 'இளஞ்சிவப்பு', pronunciation: 'இளஞ்சிவப்பு', speakText: 'இளஞ்சிவப்பு'}
                            ],
                            exercises: [
                                {
                                    type: 'count',
                                    question: 'ஒன்று முதல் ஐந்து வரை எண்ணுங்கள்',
                                    options: ['ஒன்று, இரண்டு, மூன்று, நான்கு, ஐந்து', 'ஐந்து, நான்கு, மூன்று, இரண்டு, ஒன்று', 'இரண்டு, மூன்று, நான்கு, ஐந்து, ஆறு'],
                                    answer: 'ஒன்று, இரண்டு, மூன்று, நான்கு, ஐந்து',
                                    explanation: 'சரியான எண் வரிசை: ஒன்று, இரண்டு, மூன்று, நான்கு, ஐந்து',
                                    audioText: 'ஒன்று இரண்டு மூன்று நான்கு ஐந்து'
                                },
                                {
                                    type: 'color-identification',
                                    question: 'வானம் எந்த நிறத்தில் உள்ளது?',
                                    options: ['நீலம்', 'சிவப்பு', 'பச்சை'],
                                    answer: 'நீலம்',
                                    explanation: 'வானம் பொதுவாக நீல நிறத்தில் இருக்கும்',
                                    audioText: 'நீலம்'
                                },
                                {
                                    type: 'number-word',
                                    question: 'மூன்றுக்கு பிறகு வரும் எண் எது?',
                                    options: ['நான்கு', 'இரண்டு', 'ஐந்து'],
                                    answer: 'நான்கு',
                                    explanation: 'எண் வரிசை: ஒன்று, இரண்டு, மூன்று, நான்கு, ஐந்து...',
                                    audioText: 'நான்கு'
                                }
                            ],
                            practiceSentences: [
                                'மூன்று சிவப்பு ஆப்பிள்கள் உள்ளன.',
                                'வானம் நீலம் மற்றும் புல் பச்சை.',
                                'எனக்கு ஐந்து மஞ்சள் பென்சில்கள் உள்ளன.',
                                'அவளுக்கு இரண்டு கருப்பு பூனைகள் உள்ளன.',
                                'எங்களுக்கு ஏழு வெள்ளை காகிதங்கள் தேவை.'
                            ],
                            tips: [
                                'சுற்றுப்புற பொருட்களை எண்ணி பயிற்சி செய்யுங்கள்',
                                'தினசரி பார்க்கும் பொருட்களின் நிறங்களை பெயரிடுங்கள்',
                                'எண்கள் மற்றும் நிறங்களை ஒன்றாக வாக்கியங்களில் பயன்படுத்துங்கள்'
                            ]
                        }
                    ]
                },

                hi: {
                    title: "हिंदी शब्दावली",
                    lessons: [
                        {
                            id: 'hi-vocab-1',
                            title: "अभिवादन और बुनियादी वाक्यांश",
                            content: "रोजमर्रा की communication के लिए हिंदी में आवश्यक अभिवादन और बुनियादी वाक्यांश सीखें।",
                            words: [
                                { 
                                    word: 'नमस्ते', 
                                    meaning: 'Hello', 
                                    example: 'नमस्ते, आप कैसे हैं?',
                                    pronunciation: 'नमस्ते',
                                    synonyms: ['प्रणाम'],
                                    speakText: 'नमस्ते'
                                },
                                { 
                                    word: 'धन्यवाद', 
                                    meaning: 'Thank you', 
                                    example: 'आपकी मदद के लिए धन्यवाद।',
                                    pronunciation: 'धन्यवाद',
                                    synonyms: ['शुक्रिया'],
                                    speakText: 'धन्यवाद'
                                },
                                { 
                                    word: 'कृपया', 
                                    meaning: 'Please', 
                                    example: 'कृपया मेरी मदद करें।',
                                    pronunciation: 'कृपया',
                                    synonyms: ['मेहरबानी करके'],
                                    speakText: 'कृपया'
                                },
                                { 
                                    word: 'माफ़ कीजिए', 
                                    meaning: 'Sorry/Excuse me', 
                                    example: 'देरी के लिए माफ़ कीजिए।',
                                    pronunciation: 'माफ़ कीजिए',
                                    synonyms: ['क्षमा करें'],
                                    speakText: 'माफ़ कीजिए'
                                },
                                { 
                                    word: 'हाँ', 
                                    meaning: 'Yes', 
                                    example: 'हाँ, मैं समझ गया।',
                                    pronunciation: 'हाँ',
                                    synonyms: ['जी हाँ'],
                                    speakText: 'हाँ'
                                },
                                { 
                                    word: 'नहीं', 
                                    meaning: 'No', 
                                    example: 'नहीं, मुझे नहीं पता।',
                                    pronunciation: 'नहीं',
                                    synonyms: ['जी नहीं'],
                                    speakText: 'नहीं'
                                }
                            ],
                            phrases: [
                                {phrase: 'आप कैसे हैं?', meaning: 'How are you?', pronunciation: 'आप कैसे हैं', speakText: 'आप कैसे हैं'},
                                {phrase: 'आपका नाम क्या है?', meaning: 'What is your name?', pronunciation: 'आपका नाम क्या है', speakText: 'आपका नाम क्या है'},
                                {phrase: 'मेरा नाम... है', meaning: 'My name is...', pronunciation: 'मेरा नाम है', speakText: 'मेरा नाम है'},
                                {phrase: 'आपसे मिलकर खुशी हुई', meaning: 'Nice to meet you', pronunciation: 'आपसे मिलकर खुशी हुई', speakText: 'आपसे मिलकर खुशी हुई'},
                                {phrase: 'मुझे माफ़ करें', meaning: 'Excuse me', pronunciation: 'मुझे माफ़ करें', speakText: 'मुझे माफ़ करें'}
                            ],
                            exercises: [
                                { 
                                    type: 'match', 
                                    question: 'नमस्ते का अर्थ?', 
                                    options: ['Hello', 'Thank you', 'Sorry'],
                                    answer: 'Hello',
                                    explanation: 'नमस्ते का अर्थ है Hello या Greetings',
                                    audioText: 'नमस्ते'
                                },
                                { 
                                    type: 'fill', 
                                    question: 'मदद के लिए ____', 
                                    options: ['धन्यवाद', 'नमस्ते', 'माफ़ कीजिए'],
                                    answer: 'धन्यवाद',
                                    explanation: 'मदद के लिए धन्यवाद कहते हैं',
                                    audioText: 'धन्यवाद'
                                },
                                {
                                    type: 'sentence-formation',
                                    question: '"Please help me" को हिंदी में कहें',
                                    options: ['कृपया मेरी मदद करें', 'नमस्ते मदद करें', 'धन्यवाद मदद करें'],
                                    answer: 'कृपया मेरी मदद करें',
                                    explanation: 'कृपया मेरी मदद करें सही वाक्य है',
                                    audioText: 'कृपया मेरी मदद करें'
                                },
                                {
                                    type: 'translation',
                                    question: 'How do you say "Yes" in Hindi?',
                                    options: ['हाँ', 'नहीं', 'धन्यवाद'],
                                    answer: 'हाँ',
                                    explanation: 'Yes को हिंदी में हाँ कहते हैं',
                                    audioText: 'हाँ'
                                }
                            ],
                            practiceDialogs: [
                                {
                                    personA: {text: 'नमस्ते, आप कैसे हैं?', pronunciation: 'नमस्ते, आप कैसे हैं', speakText: 'नमस्ते, आप कैसे हैं'},
                                    personB: {text: 'मैं ठीक हूँ, धन्यवाद। और आप?', pronunciation: 'मैं ठीक हूँ, धन्यवाद। और आप', speakText: 'मैं ठीक हूँ, धन्यवाद। और आप'}
                                },
                                {
                                    personA: {text: 'आपका नाम क्या है?', pronunciation: 'आपका नाम क्या है', speakText: 'आपका नाम क्या है'},
                                    personB: {text: 'मेरा नाम राहुल है। आपसे मिलकर खुशी हुई।', pronunciation: 'मेरा नाम राहुल है। आपसे मिलकर खुशी हुई', speakText: 'मेरा नाम राहुल है। आपसे मिलकर खुशी हुई'}
                                },
                                {
                                    personA: {text: 'मुझे माफ़ करें, क्या आप मेरी मदद कर सकते हैं?', pronunciation: 'मुझे माफ़ करें, क्या आप मेरी मदद कर सकते हैं', speakText: 'मुझे माफ़ करें, क्या आप मेरी मदद कर सकते हैं'},
                                    personB: {text: 'हाँ, ज़रूर। मैं आपकी क्या मदद कर सकता हूँ?', pronunciation: 'हाँ, ज़रूर। मैं आपकी क्या मदद कर सकता हूँ', speakText: 'हाँ, ज़रूर। मैं आपकी क्या मदद कर सकता हूँ'}
                                }
                            ],
                            culturalNotes: [
                                'भारत में नमस्ते कहते समय हाथ जोड़कर प्रणाम करना आम बात है',
                                'बड़ों का आदर करने के लिए "जी" शब्द का प्रयोग करें',
                                'धन्यवाद कहना अच्छी आदत मानी जाती है'
                            ]
                        },
                        {
                            id: 'hi-vocab-2',
                            title: "संख्याएँ और रंग",
                            content: "1-20 तक की संख्याएँ और बुनियादी रंग हिंदी में सीखें।",
                            words: [
                                {
                                    word: 'एक',
                                    meaning: 'संख्या 1',
                                    example: 'मेरे पास एक सेब है।',
                                    pronunciation: 'एक',
                                    synonyms: ['पहला'],
                                    speakText: 'एक'
                                },
                                {
                                    word: 'दो',
                                    meaning: 'संख्या 2',
                                    example: 'दो चिड़ियाँ गा रही हैं।',
                                    pronunciation: 'दो',
                                    synonyms: ['दूसरा'],
                                    speakText: 'दो'
                                },
                                {
                                    word: 'तीन',
                                    meaning: 'संख्या 3',
                                    example: 'तीन छोटे सूअर।',
                                    pronunciation: 'तीन',
                                    synonyms: ['तीसरा'],
                                    speakText: 'तीन'
                                },
                                {
                                    word: 'लाल',
                                    meaning: 'खून या आग का रंग',
                                    example: 'सेब लाल है।',
                                    pronunciation: 'लाल',
                                    synonyms: ['सुर्ख'],
                                    speakText: 'लाल'
                                },
                                {
                                    word: 'नीला',
                                    meaning: 'आकाश या समुद्र का रंग',
                                    example: 'आकाश नीला है।',
                                    pronunciation: 'नीला',
                                    synonyms: ['आसमानी'],
                                    speakText: 'नीला'
                                },
                                {
                                    word: 'हरा',
                                    meaning: 'घास या पत्तियों का रंग',
                                    example: 'घास हरी है।',
                                    pronunciation: 'हरा',
                                    synonyms: ['सब्ज'],
                                    speakText: 'हरा'
                                },
                                {
                                    word: 'पीला',
                                    meaning: 'सूरज या केले का रंग',
                                    example: 'सूरज पीला है।',
                                    pronunciation: 'पीला',
                                    synonyms: ['जर्द'],
                                    speakText: 'पीला'
                                }
                            ],
                            numbers: [
                                {number: '1', word: 'एक', pronunciation: 'एक', speakText: 'एक'},
                                {number: '2', word: 'दो', pronunciation: 'दो', speakText: 'दो'},
                                {number: '3', word: 'तीन', pronunciation: 'तीन', speakText: 'तीन'},
                                {number: '4', word: 'चार', pronunciation: 'चार', speakText: 'चार'},
                                {number: '5', word: 'पाँच', pronunciation: 'पाँच', speakText: 'पाँच'},
                                {number: '6', word: 'छह', pronunciation: 'छह', speakText: 'छह'},
                                {number: '7', word: 'सात', pronunciation: 'सात', speakText: 'सात'},
                                {number: '8', word: 'आठ', pronunciation: 'आठ', speakText: 'आठ'},
                                {number: '9', word: 'नौ', pronunciation: 'नौ', speakText: 'नौ'},
                                {number: '10', word: 'दस', pronunciation: 'दस', speakText: 'दस'}
                            ],
                            colors: [
                                {color: 'लाल', pronunciation: 'लाल', speakText: 'लाल'},
                                {color: 'नीला', pronunciation: 'नीला', speakText: 'नीला'},
                                {color: 'हरा', pronunciation: 'हरा', speakText: 'हरा'},
                                {color: 'पीला', pronunciation: 'पीला', speakText: 'पीला'},
                                {color: 'नारंगी', pronunciation: 'नारंगी', speakText: 'नारंगी'},
                                {color: 'बैंगनी', pronunciation: 'बैंगनी', speakText: 'बैंगनी'},
                                {color: 'काला', pronunciation: 'काला', speakText: 'काला'},
                                {color: 'सफेद', pronunciation: 'सफेद', speakText: 'सफेद'},
                                {color: 'भूरा', pronunciation: 'भूरा', speakText: 'भूरा'},
                                {color: 'गुलाबी', pronunciation: 'गुलाबी', speakText: 'गुलाबी'}
                            ],
                            exercises: [
                                {
                                    type: 'count',
                                    question: 'एक से पाँच तक गिनें',
                                    options: ['एक, दो, तीन, चार, पाँच', 'पाँच, चार, तीन, दो, एक', 'दो, तीन, चार, पाँच, छह'],
                                    answer: 'एक, दो, तीन, चार, पाँच',
                                    explanation: 'सही गिनती क्रम: एक, दो, तीन, चार, पाँच',
                                    audioText: 'एक दो तीन चार पाँच'
                                },
                                {
                                    type: 'color-identification',
                                    question: 'आकाश किस रंग का होता है?',
                                    options: ['नीला', 'लाल', 'हरा'],
                                    answer: 'नीला',
                                    explanation: 'आकाश आमतौर पर नीले रंग का होता है',
                                    audioText: 'नीला'
                                },
                                {
                                    type: 'number-word',
                                    question: 'तीन के बाद कौन सी संख्या आती है?',
                                    options: ['चार', 'दो', 'पाँच'],
                                    answer: 'चार',
                                    explanation: 'संख्या क्रम: एक, दो, तीन, चार, पाँच...',
                                    audioText: 'चार'
                                }
                            ],
                            practiceSentences: [
                                'मैं तीन लाल सेब देखता हूँ।',
                                'आकाश नीला है और घास हरी है।',
                                'मेरे पास पाँच पीली पेंसिलें हैं।',
                                'उसके पास दो काली बिल्लियाँ हैं।',
                                'हमें सात सफेद कागज चाहिए।'
                            ],
                            tips: [
                                'अपने आसपास की वस्तुओं को गिनकर अभ्यास करें',
                                'रोज देखी जाने वाली चीजों के रंग बताएँ',
                                'वाक्यों में संख्याओं और रंगों को एक साथ प्रयोग करें'
                            ]
                        }
                    ]
                },

                fr: {
                    title: "Vocabulaire Français",
                    lessons: [
                        {
                            id: 'fr-vocab-1',
                            title: "Salutations et Phrases de Base",
                            content: "Apprenez les salutations essentielles et les expressions de base en français pour la communication quotidienne.",
                            words: [
                                { 
                                    word: 'Bonjour', 
                                    meaning: 'Hello/Good day', 
                                    example: 'Bonjour, comment allez-vous?',
                                    pronunciation: 'Bonjour',
                                    synonyms: ['Salut'],
                                    speakText: 'Bonjour'
                                },
                                { 
                                    word: 'Merci', 
                                    meaning: 'Thank you', 
                                    example: 'Merci beaucoup!',
                                    pronunciation: 'Merci',
                                    synonyms: ['Je vous remercie'],
                                    speakText: 'Merci'
                                },
                                { 
                                    word: "S'il vous plaît", 
                                    meaning: 'Please', 
                                    example: "S'il vous plaît, aidez-moi.",
                                    pronunciation: 'S\'il vous plaît',
                                    synonyms: ['Je vous prie'],
                                    speakText: 'S\'il vous plaît'
                                },
                                { 
                                    word: 'Excusez-moi', 
                                    meaning: 'Excuse me/Sorry', 
                                    example: 'Excusez-moi pour le retard.',
                                    pronunciation: 'Excusez-moi',
                                    synonyms: ['Pardon'],
                                    speakText: 'Excusez-moi'
                                },
                                { 
                                    word: 'Oui', 
                                    meaning: 'Yes', 
                                    example: 'Oui, je comprends.',
                                    pronunciation: 'Oui',
                                    synonyms: ['D\'accord'],
                                    speakText: 'Oui'
                                },
                                { 
                                    word: 'Non', 
                                    meaning: 'No', 
                                    example: 'Non, merci.',
                                    pronunciation: 'Non',
                                    synonyms: ['Pas du tout'],
                                    speakText: 'Non'
                                }
                            ],
                            phrases: [
                                {phrase: 'Comment allez-vous?', meaning: 'How are you? (formal)', pronunciation: 'Comment allez-vous', speakText: 'Comment allez-vous'},
                                {phrase: 'Comment ça va?', meaning: 'How are you? (informal)', pronunciation: 'Comment ça va', speakText: 'Comment ça va'},
                                {phrase: 'Quel est votre nom?', meaning: 'What is your name?', pronunciation: 'Quel est votre nom', speakText: 'Quel est votre nom'},
                                {phrase: 'Je m\'appelle...', meaning: 'My name is...', pronunciation: 'Je m\'appelle', speakText: 'Je m\'appelle'},
                                {phrase: 'Enchanté(e)', meaning: 'Nice to meet you', pronunciation: 'Enchanté', speakText: 'Enchanté'}
                            ],
                            exercises: [
                                { 
                                    type: 'match', 
                                    question: 'Bonjour signifie?', 
                                    options: ['Hello', 'Thank you', 'Sorry'],
                                    answer: 'Hello',
                                    explanation: 'Bonjour signifie Hello ou Good day',
                                    audioText: 'Bonjour'
                                },
                                { 
                                    type: 'fill', 
                                    question: '____ beaucoup!', 
                                    options: ['Merci', 'Bonjour', 'Excusez-moi'],
                                    answer: 'Merci',
                                    explanation: 'Merci beaucoup signifie Thank you very much',
                                    audioText: 'Merci beaucoup'
                                },
                                {
                                    type: 'sentence-formation',
                                    question: 'Formez une demande polie avec "s\'il vous plaît"',
                                    options: ["S'il vous plaît, aidez-moi", "Bonjour aidez-moi", "Merci aidez-moi"],
                                    answer: "S'il vous plaît, aidez-moi",
                                    explanation: "S'il vous plaît, aidez-moi est une demande polie",
                                    audioText: "S'il vous plaît, aidez-moi"
                                },
                                {
                                    type: 'translation',
                                    question: 'How do you say "Yes" in French?',
                                    options: ['Oui', 'Non', 'Merci'],
                                    answer: 'Oui',
                                    explanation: 'Yes se dit Oui en français',
                                    audioText: 'Oui'
                                }
                            ],
                            practiceDialogs: [
                                {
                                    personA: {text: 'Bonjour, comment allez-vous?', pronunciation: 'Bonjour, comment allez-vous', speakText: 'Bonjour, comment allez-vous'},
                                    personB: {text: 'Je vais bien, merci. Et vous?', pronunciation: 'Je vais bien, merci. Et vous', speakText: 'Je vais bien, merci. Et vous'}
                                },
                                {
                                    personA: {text: 'Quel est votre nom?', pronunciation: 'Quel est votre nom', speakText: 'Quel est votre nom'},
                                    personB: {text: 'Je m\'appelle Marie. Enchantée.', pronunciation: 'Je m\'appelle Marie. Enchantée', speakText: 'Je m\'appelle Marie. Enchantée'}
                                },
                                {
                                    personA: {text: 'Excusez-moi, pouvez-vous m\'aider?', pronunciation: 'Excusez-moi, pouvez-vous m\'aider', speakText: 'Excusez-moi, pouvez-vous m\'aider'},
                                    personB: {text: 'Oui, bien sûr. Comment puis-je vous aider?', pronunciation: 'Oui, bien sûr. Comment puis-je vous aider', speakText: 'Oui, bien sûr. Comment puis-je vous aider'}
                                }
                            ],
                            culturalNotes: [
                                'En France, on fait souvent la bise (cheek kiss) entre amis',
                                'Bonjour est utilisé le matin et l\'après-midi',
                                'Bonsoir est utilisé le soir',
                                'Il est important de dire bonjour en entrant dans un magasin'
                            ]
                        }
                    ]
                },

                de: {
                    title: "Deutscher Wortschatz",
                    lessons: [
                        {
                            id: 'de-vocab-1',
                            title: "Begrüßungen und Grundlegende Sätze",
                            content: "Lernen Sie grundlegende deutsche Grüße und Ausdrücke für die tägliche Kommunikation.",
                            words: [
                                { 
                                    word: 'Hallo', 
                                    meaning: 'Hello', 
                                    example: 'Hallo, wie geht es dir?',
                                    pronunciation: 'Hallo',
                                    synonyms: ['Guten Tag'],
                                    speakText: 'Hallo'
                                },
                                { 
                                    word: 'Danke', 
                                    meaning: 'Thank you', 
                                    example: 'Danke für deine Hilfe.',
                                    pronunciation: 'Danke',
                                    synonyms: ['Vielen Dank'],
                                    speakText: 'Danke'
                                },
                                { 
                                    word: 'Bitte', 
                                    meaning: 'Please/You\'re welcome', 
                                    example: 'Bitte hilf mir.',
                                    pronunciation: 'Bitte',
                                    synonyms: ['Gern geschehen'],
                                    speakText: 'Bitte'
                                },
                                { 
                                    word: 'Entschuldigung', 
                                    meaning: 'Sorry/Excuse me', 
                                    example: 'Entschuldigung für die Verspätung.',
                                    pronunciation: 'Entschuldigung',
                                    synonyms: ['Tut mir leid'],
                                    speakText: 'Entschuldigung'
                                },
                                { 
                                    word: 'Ja', 
                                    meaning: 'Yes', 
                                    example: 'Ja, ich verstehe.',
                                    pronunciation: 'Ja',
                                    synonyms: ['Jawohl'],
                                    speakText: 'Ja'
                                },
                                { 
                                    word: 'Nein', 
                                    meaning: 'No', 
                                    example: 'Nein, danke.',
                                    pronunciation: 'Nein',
                                    synonyms: ['Nee'],
                                    speakText: 'Nein'
                                }
                            ],
                            phrases: [
                                {phrase: 'Wie geht es Ihnen?', meaning: 'How are you? (formal)', pronunciation: 'Wie geht es Ihnen', speakText: 'Wie geht es Ihnen'},
                                {phrase: 'Wie geht\'s?', meaning: 'How are you? (informal)', pronunciation: 'Wie geht\'s', speakText: 'Wie geht\'s'},
                                {phrase: 'Wie ist Ihr Name?', meaning: 'What is your name?', pronunciation: 'Wie ist Ihr Name', speakText: 'Wie ist Ihr Name'},
                                {phrase: 'Mein Name ist...', meaning: 'My name is...', pronunciation: 'Mein Name ist', speakText: 'Mein Name ist'},
                                {phrase: 'Freut mich', meaning: 'Nice to meet you', pronunciation: 'Freut mich', speakText: 'Freut mich'}
                            ],
                            exercises: [
                                { 
                                    type: 'match', 
                                    question: 'Hallo bedeutet?', 
                                    options: ['Hello', 'Thank you', 'Sorry'],
                                    answer: 'Hello',
                                    explanation: 'Hallo bedeutet Hello auf Deutsch',
                                    audioText: 'Hallo'
                                },
                                { 
                                    type: 'fill', 
                                    question: '____ für deine Hilfe.', 
                                    options: ['Danke', 'Hallo', 'Entschuldigung'],
                                    answer: 'Danke',
                                    explanation: 'Danke für deine Hilfe bedeutet Thank you for your help',
                                    audioText: 'Danke für deine Hilfe'
                                },
                                {
                                    type: 'sentence-formation',
                                    question: 'Bilden Sie eine höfliche Bitte mit "Bitte"',
                                    options: ['Bitte hilf mir', 'Hallo hilf mir', 'Danke hilf mir'],
                                    answer: 'Bitte hilf mir',
                                    explanation: 'Bitte hilf mir ist eine höfliche Bitte',
                                    audioText: 'Bitte hilf mir'
                                },
                                {
                                    type: 'translation',
                                    question: 'How do you say "Yes" in German?',
                                    options: ['Ja', 'Nein', 'Danke'],
                                    answer: 'Ja',
                                    explanation: 'Yes heißt Ja auf Deutsch',
                                    audioText: 'Ja'
                                }
                            ],
                            practiceDialogs: [
                                {
                                    personA: {text: 'Hallo, wie geht es Ihnen?', pronunciation: 'Hallo, wie geht es Ihnen', speakText: 'Hallo, wie geht es Ihnen'},
                                    personB: {text: 'Mir geht es gut, danke. Und Ihnen?', pronunciation: 'Mir geht es gut, danke. Und Ihnen', speakText: 'Mir geht es gut, danke. Und Ihnen'}
                                },
                                {
                                    personA: {text: 'Wie ist Ihr Name?', pronunciation: 'Wie ist Ihr Name', speakText: 'Wie ist Ihr Name'},
                                    personB: {text: 'Mein Name ist Thomas. Freut mich.', pronunciation: 'Mein Name ist Thomas. Freut mich', speakText: 'Mein Name ist Thomas. Freut mich'}
                                },
                                {
                                    personA: {text: 'Entschuldigung, können Sie mir helfen?', pronunciation: 'Entschuldigung, können Sie mir helfen', speakText: 'Entschuldigung, können Sie mir helfen'},
                                    personB: {text: 'Ja, natürlich. Wie kann ich Ihnen helfen?', pronunciation: 'Ja, natürlich. Wie kann ich Ihnen helfen', speakText: 'Ja, natürlich. Wie kann ich Ihnen helfen'}
                                }
                            ],
                            culturalNotes: [
                                'In Deutschland gibt man sich oft die Hand zur Begrüßung',
                                'Sie wird für formelle Situationen verwendet',
                                'Du wird für informelle Situationen verwendet',
                                'Pünktlichkeit wird in der deutschen Kultur sehr geschätzt'
                            ]
                        }
                    ]
                }
            },

            // GRAMMAR MODULE (Placeholder structure)
           // ========== GRAMMAR MODULE ==========
grammar: {
    en: {
        title: "English Grammar",
        lessons: [
            {
                id: 'en-grammar-1',
                title: "Basic Sentence Structure",
                content: "Learn the fundamental structure of English sentences including subjects, verbs, and objects.",
                concepts: [
                    {
                        name: "Subject-Verb-Object",
                        explanation: "English typically follows Subject-Verb-Object (SVO) order",
                        examples: [
                            "I eat apples.",
                            "She reads books.",
                            "They play football."
                        ],
                        rules: [
                            "The subject comes first",
                            "The verb comes second", 
                            "The object comes last"
                        ]
                    },
                    {
                        name: "Articles",
                        explanation: "A, an, and the are used before nouns",
                        examples: [
                            "A cat (any cat)",
                            "An apple (starts with vowel sound)",
                            "The sun (specific sun)"
                        ],
                        rules: [
                            "Use 'a' before consonant sounds",
                            "Use 'an' before vowel sounds",
                            "Use 'the' for specific things"
                        ]
                    }
                ],
                exercises: [
                    {
                        type: 'sentence-formation',
                        question: 'Form a sentence with: I / eat / apples',
                        options: ['I apples eat', 'Eat I apples', 'I eat apples'],
                        answer: 'I eat apples',
                        explanation: 'Correct SVO order: Subject (I) + Verb (eat) + Object (apples)',
                        audioText: 'I eat apples'
                    },
                    {
                        type: 'article-choice',
                        question: 'Choose the correct article: ___ elephant',
                        options: ['a', 'an', 'the'],
                        answer: 'an',
                        explanation: 'Elephant starts with a vowel sound, so we use "an"',
                        audioText: 'an elephant'
                    },
                    {
                        type: 'word-order',
                        question: 'Arrange in correct order: reads / She / books',
                        options: ['She reads books', 'Reads she books', 'Books she reads'],
                        answer: 'She reads books',
                        explanation: 'Subject (She) + Verb (reads) + Object (books)',
                        audioText: 'She reads books'
                    }
                ],
                practiceSentences: [
                    "The boy plays with a ball.",
                    "An apple falls from the tree.",
                    "We eat dinner at seven.",
                    "She writes in her notebook.",
                    "They watch television every day."
                ],
                tips: [
                    "Remember the SVO order: Subject first, then verb, then object",
                    "Practice with simple sentences first",
                    "Read English books to see sentence patterns"
                ]
            },
            {
                id: 'en-grammar-2',
                title: "Present Tense Verbs",
                content: "Learn how to use present tense verbs for current actions and general truths.",
                concepts: [
                    {
                        name: "Simple Present",
                        explanation: "Used for habits, general truths, and fixed arrangements",
                        examples: [
                            "I work every day.",
                            "The sun rises in the east.",
                            "She speaks English well."
                        ],
                        rules: [
                            "Add -s for he/she/it (third person singular)",
                            "No change for I/you/we/they",
                            "Use for routines and facts"
                        ]
                    },
                    {
                        name: "Present Continuous",
                        explanation: "Used for actions happening now or around now",
                        examples: [
                            "I am reading a book.",
                            "They are playing outside.",
                            "She is cooking dinner."
                        ],
                        rules: [
                            "Use am/is/are + verb-ing",
                            "Use for temporary actions",
                            "Use for changing situations"
                        ]
                    }
                ],
                exercises: [
                    {
                        type: 'verb-conjugation',
                        question: 'He ___ (work) in an office.',
                        options: ['work', 'works', 'working'],
                        answer: 'works',
                        explanation: 'Third person singular (he/she/it) takes -s ending',
                        audioText: 'He works in an office'
                    },
                    {
                        type: 'tense-choice',
                        question: 'Right now, I ___ (read) a book.',
                        options: ['read', 'am reading', 'reads'],
                        answer: 'am reading',
                        explanation: 'Use present continuous for actions happening now',
                        audioText: 'I am reading a book'
                    },
                    {
                        type: 'sentence-correction',
                        question: 'Correct: She go to school every day.',
                        options: ['She goes to school every day', 'She going to school every day', 'She is go to school every day'],
                        answer: 'She goes to school every day',
                        explanation: 'Third person singular requires -s ending: goes',
                        audioText: 'She goes to school every day'
                    }
                ],
                practiceSentences: [
                    "We study English every morning.",
                    "He is watching television now.",
                    "Birds fly in the sky.",
                    "I am learning grammar currently.",
                    "Water boils at 100 degrees."
                ],
                tips: [
                    "Use simple present for routines and facts",
                    "Use present continuous for actions happening now",
                    "Remember the -s ending for he/she/it"
                ]
            },
            {
                id: 'en-grammar-3',
                title: "Questions and Negatives",
                content: "Learn how to form questions and negative sentences in English.",
                concepts: [
                    {
                        name: "Yes/No Questions",
                        explanation: "Questions that can be answered with yes or no",
                        examples: [
                            "Do you like coffee?",
                            "Is she coming?",
                            "Are they ready?"
                        ],
                        rules: [
                            "Use do/does for simple present questions",
                            "Use am/is/are for present continuous",
                            "Invert subject and verb for be-verbs"
                        ]
                    },
                    {
                        name: "Negative Sentences",
                        explanation: "Sentences that express negation",
                        examples: [
                            "I do not like tea.",
                            "She is not working today.",
                            "They don't play football."
                        ],
                        rules: [
                            "Use do not/does not for simple present",
                            "Use am not/is not/are not for present continuous",
                            "Use contractions: don't, doesn't, isn't, aren't"
                        ]
                    }
                ],
                exercises: [
                    {
                        type: 'question-formation',
                        question: 'Make a question: She speaks English.',
                        options: ['Does she speak English?', 'Do she speak English?', 'Is she speak English?'],
                        answer: 'Does she speak English?',
                        explanation: 'Use "does" for third person singular questions',
                        audioText: 'Does she speak English'
                    },
                    {
                        type: 'negative-formation',
                        question: 'Make negative: I like coffee.',
                        options: ['I do not like coffee', 'I not like coffee', 'I does not like coffee'],
                        answer: 'I do not like coffee',
                        explanation: 'Use "do not" for first person negative',
                        audioText: 'I do not like coffee'
                    },
                    {
                        type: 'sentence-completion',
                        question: '___ you understand this lesson?',
                        options: ['Do', 'Does', 'Are'],
                        answer: 'Do',
                        explanation: 'Use "do" for second person questions',
                        audioText: 'Do you understand this lesson'
                    }
                ],
                practiceSentences: [
                    "Do they live here?",
                    "She doesn't work on Sundays.",
                    "Are you listening to me?",
                    "I am not going to the party.",
                    "Does he like pizza?"
                ],
                tips: [
                    "Use do/does for most present tense questions",
                    "Remember the word order for questions",
                    "Practice both full and contracted negative forms"
                ]
            }
        ]
    },

    ta: {
        title: "தமிழ் இலக்கணம்",
        lessons: [
            {
                id: 'ta-grammar-1',
                title: "வாக்கிய அமைப்பு",
                content: "தமிழ் வாக்கியங்கள் எவ்வாறு அமைக்கப்படுகின்றன என்பதை கற்றுக்கொள்ளுங்கள்.",
                concepts: [
                    {
                        name: "எழுவாய்-பயனிலை-செயப்படுபொருள்",
                        explanation: "தமிழ் வாக்கியங்கள் பொதுவாக எழுவாய்-பயனிலை-செயப்படுபொருள் வரிசையில் அமைகின்றன",
                        examples: [
                            "நான் புத்தகம் படிக்கிறேன்.",
                            "அவள் பாடல் பாடுகிறாள்.",
                            "அவர்கள் கால்பந்து விளையாடுகிறார்கள்."
                        ],
                        rules: [
                            "எழுவாய் முதலில் வரும்",
                            "பயனிலை இரண்டாவதாக வரும்",
                            "செயப்படுபொருள் கடைசியாக வரும்"
                        ]
                    },
                    {
                        name: "இடைநிலைகள்",
                        explanation: "சொற்களுக்கு இடையே பயன்படுத்தப்படும் சொற்கள்",
                        examples: [
                            "ஒரு புத்தகம்",
                            "ஓர் ஆப்பிள்",
                            "சில மாணவர்கள்"
                        ],
                        rules: [
                            "ஒரு - ஒலி மொழி முன்",
                            "ஓர் - ஒளி மொழி முன்", 
                            "சில - பலவற்றை குறிக்க"
                        ]
                    }
                ],
                exercises: [
                    {
                        type: 'sentence-formation',
                        question: 'சரியான வாக்கியத்தை தேர்ந்தெடுக்கவும்: நான் / படிக்கிறேன் / புத்தகம்',
                        options: ['நான் புத்தகம் படிக்கிறேன்', 'படிக்கிறேன் நான் புத்தகம்', 'புத்தகம் நான் படிக்கிறேன்'],
                        answer: 'நான் புத்தகம் படிக்கிறேன்',
                        explanation: 'சரியான வரிசை: எழுவாய் (நான்) + செயப்படுபொருள் (புத்தகம்) + பயனிலை (படிக்கிறேன்)',
                        audioText: 'நான் புத்தகம் படிக்கிறேன்'
                    },
                    {
                        type: 'word-choice',
                        question: '___ மரம் (ஒரு/ஓர்)',
                        options: ['ஒரு', 'ஓர்', 'சில'],
                        answer: 'ஓர்',
                        explanation: 'மரம் என்ற சொல் ஒளி எழுத்தில் தொடங்குவதால் "ஓர்" பயன்படுத்தப்படும்',
                        audioText: 'ஓர் மரம்'
                    },
                    {
                        type: 'word-order',
                        question: 'சரியான வரிசையை தேர்ந்தெடுக்கவும்: பாடுகிறாள் / அவள் / பாட்டு',
                        options: ['அவள் பாட்டு பாடுகிறாள்', 'பாடுகிறாள் அவள் பாட்டு', 'பாட்டு அவள் பாடுகிறாள்'],
                        answer: 'அவள் பாட்டு பாடுகிறாள்',
                        explanation: 'எழுவாய் (அவள்) + செயப்படுபொருள் (பாட்டு) + பயனிலை (பாடுகிறாள்)',
                        audioText: 'அவள் பாட்டு பாடுகிறாள்'
                    }
                ],
                practiceSentences: [
                    "சிறுவன் பந்துடன் விளையாடுகிறான்.",
                    "ஓர் ஆப்பிள் மரத்தில் இருந்து விழுகிறது.",
                    "நாங்கள் மாலை ஏழு மணிக்கு உணவு உண்கிறோம்.",
                    "அவள் தன் குறிப்பேட்டில் எழுதுகிறாள்.",
                    "அவர்கள் தினமும் தொலைக்காட்சி பார்க்கிறார்கள்."
                ],
                tips: [
                    "தமிழ் வாக்கியங்கள் எழுவாய்-செயப்படுபொருள்-பயனிலை வரிசையில் அமைகின்றன",
                    "எளிய வாக்கியங்களுடன் பயிற்சி செய்யுங்கள்",
                    "தமிழ் புத்தகங்களை வாசித்து வாக்கிய அமைப்புகளை கவனியுங்கள்"
                ]
            },
            {
                id: 'ta-grammar-2',
                title: "நிகழ்கால வினைச்சொற்கள்",
                content: "தற்போதைய செயல்களுக்கும் பொதுவான உண்மைகளுக்கும் நிகழ்கால வினைச்சொற்களை பயன்படுத்தும் முறை.",
                concepts: [
                    {
                        name: "இறந்தகால வினைச்சொற்கள்",
                        explanation: "கடந்த காலத்தில் நடந்த செயல்களுக்கு பயன்படுத்தப்படும்",
                        examples: [
                            "நான் நேற்று பள்ளி சென்றேன்.",
                            "அவள் காலையில் படித்தாள்.",
                            "அவர்கள் நேற்று விளையாடினார்கள்."
                        ],
                        rules: [
                            "கடந்த காலத்தை குறிக்கும் விகுதிகள் சேர்க்கப்படும்",
                            "பால், எண், இடம் ஆகியவற்றிற்கேற்ப மாறும்",
                            "வினைச்சொல்லின் அடிப்படை வடிவம் மாறும்"
                        ]
                    },
                    {
                        name: "நிகழ்கால வினைச்சொற்கள்",
                        explanation: "தற்போது நடக்கும் செயல்களுக்கு பயன்படுத்தப்படும்",
                        examples: [
                            "நான் புத்தகம் படிக்கிறேன்.",
                            "அவர்கள் வெளியே விளையாடுகிறார்கள்.",
                            "அவள் சமையல் செய்கிறாள்."
                        ],
                        rules: [
                            "கிற், கின்ற் போன்ற விகுதிகள் சேர்க்கப்படும்",
                            "தற்போதைய செயல்களை குறிக்கும்",
                            "தற்காலிக செயல்களுக்கு பயன்படும்"
                        ]
                    }
                ],
                exercises: [
                    {
                        type: 'verb-conjugation',
                        question: 'அவன் அலுவலகத்தில் ___ (வேலை) செய்கிறான்.',
                        options: ['வேலை', 'வேலையை', 'வேலையாக'],
                        answer: 'வேலை',
                        explanation: 'வினைச்சொல் "செய்கிறான்" உடன் "வேலை" சரியான பயன்பாடு',
                        audioText: 'அவன் அலுவலகத்தில் வேலை செய்கிறான்'
                    },
                    {
                        type: 'tense-choice',
                        question: 'இப்போது, நான் ___ (படிக்கிறேன்) ஒரு புத்தகம்.',
                        options: ['படிக்கிறேன்', 'படித்தேன்', 'படிப்பேன்'],
                        answer: 'படிக்கிறேன்',
                        explanation: 'தற்போது நடக்கும் செயலுக்கு நிகழ்காலம் பயன்படுத்தப்படும்',
                        audioText: 'நான் படிக்கிறேன்'
                    },
                    {
                        type: 'sentence-correction',
                        question: 'திருத்தம்: அவள் பள்ளி செல்றாள்.',
                        options: ['அவள் பள்ளி செல்கிறாள்', 'அவள் பள்ளி சென்றாள்', 'அவள் பள்ளி செல்வாள்'],
                        answer: 'அவள் பள்ளி செல்கிறாள்',
                        explanation: 'சரியான நிகழ்கால வடிவம் "செல்கிறாள்"',
                        audioText: 'அவள் பள்ளி செல்கிறாள்'
                    }
                ],
                practiceSentences: [
                    "நாங்கள் காலை தமிழ் படிக்கிறோம்.",
                    "அவன் இப்போது தொலைக்காட்சி பார்க்கிறான்.",
                    "பறவைகள் வானத்தில் பறக்கின்றன.",
                    "நான் இப்போது இலக்கணம் கற்றுக்கொள்கிறேன்.",
                    "நீர் நூறு டிகிரியில் கொதிக்கிறது."
                ],
                tips: [
                    "வினைச்சொற்கள் பால், எண், இடம் ஆகியவற்றிற்கேற்ப மாறுபடும்",
                    "நிகழ்கால வினைகளில் 'கிற' விகுதி பொதுவாக வரும்",
                    "பயிற்சி செய்வதற்கு எளிய வாக்கியங்களுடன் தொடங்குங்கள்"
                ]
            },
            {
                id: 'ta-grammar-3',
                title: "கேள்விகள் மற்றும் எதிர்மறை வாக்கியங்கள்",
                content: "தமிழில் கேள்விகள் மற்றும் எதிர்மறை வாக்கியங்களை எவ்வாறு உருவாக்குவது என்பதை கற்றுக்கொள்ளுங்கள்.",
                concepts: [
                    {
                        name: "ஆம்/இல்லை கேள்விகள்",
                        explanation: "ஆம் அல்லது இல்லை என்று பதிலளிக்கக்கூடிய கேள்விகள்",
                        examples: [
                            "நீங்கள் காபி விரும்புகிறீர்களா?",
                            "அவள் வருகிறாளா?",
                            "அவர்கள் தயாராக உள்ளனரா?"
                        ],
                        rules: [
                            "கேள்வி முன்னொட்டுகள் பயன்படுத்தப்படும்",
                            "'ஆ', 'ஏ', 'ஓ' போன்ற எழுத்துகள் சேர்க்கப்படும்",
                            "வினைச்சொல்லின் இறுதியில் மாற்றம் வரும்"
                        ]
                    },
                    {
                        name: "எதிர்மறை வாக்கியங்கள்",
                        explanation: "மறுப்பை வெளிப்படுத்தும் வாக்கியங்கள்",
                        examples: [
                            "நான் தேநீர் விரும்பவில்லை.",
                            "அவள் இன்று வேலை செய்யவில்லை.",
                            "அவர்கள் கால்பந்து விளையாடவில்லை."
                        ],
                        rules: [
                            "இல்லை, அல்ல, மாட்ட் போன்ற சொற்கள் பயன்படும்",
                            "வினைச்சொல்லுடன் எதிர்மறை இடைநிலைகள் சேர்க்கப்படும்",
                            "சுருக்கமான வடிவங்கள் பயன்படுத்தப்படும்"
                        ]
                    }
                ],
                exercises: [
                    {
                        type: 'question-formation',
                        question: 'கேள்வியாக மாற்றவும்: அவள் தமிழ் பேசுகிறாள்.',
                        options: ['அவள் தமிழ் பேசுகிறாளா?', 'அவள் தமிழ் பேசினாளா?', 'அவள் தமிழ் பேசுவாளா?'],
                        answer: 'அவள் தமிழ் பேசுகிறாளா?',
                        explanation: 'நிகழ்கால கேள்விக்கு "ஆ" விகுதி சேர்க்கப்படும்',
                        audioText: 'அவள் தமிழ் பேசுகிறாளா'
                    },
                    {
                        type: 'negative-formation',
                        question: 'எதிர்மறையாக மாற்றவும்: நான் காபி விரும்புகிறேன்.',
                        options: ['நான் காபி விரும்பவில்லை', 'நான் காபி விரும்பேன்', 'நான் காபி விரும்பமாட்டேன்'],
                        answer: 'நான் காபி விரும்பவில்லை',
                        explanation: 'விரும்பவில்லை என்பது எதிர்மறை வடிவம்',
                        audioText: 'நான் காபி விரும்பவில்லை'
                    },
                    {
                        type: 'sentence-completion',
                        question: '___ இந்த பாடம் புரிகிறதா?',
                        options: ['உங்களுக்கு', 'உன்னை', 'உங்களை'],
                        answer: 'உங்களுக்கு',
                        explanation: 'சரியான கேள்வி வாக்கிய அமைப்பு "உங்களுக்கு புரிகிறதா?"',
                        audioText: 'உங்களுக்கு புரிகிறதா'
                    }
                ],
                practiceSentences: [
                    "அவர்கள் இங்கே வசிக்கிறார்களா?",
                    "அவள் ஞாயிற்றுக்கிழமைகளில் வேலை செய்யவில்லை.",
                    "நீங்கள் என் பேச்சை கேட்கிறீர்களா?",
                    "நான் பார்ட்டிக்கு செல்லவில்லை.",
                    "அவன் பீட்சா விரும்புகிறானா?"
                ],
                tips: [
                    "கேள்வி வாக்கியங்களில் வினைச்சொல்லின் இறுதியில் மாற்றம் வரும்",
                    "எதிர்மறை வாக்கியங்களுக்கு சரியான எதிர்மறை சொற்களை பயன்படுத்துங்கள்",
                    "முழு மற்றும் சுருக்க எதிர்மறை வடிவங்களை பயிற்சி செய்யுங்கள்"
                ]
            }
        ]
    },

    hi: {
        title: "हिंदी व्याकरण",
        lessons: [
            {
                id: 'hi-grammar-1',
                title: "वाक्य संरचना",
                content: "हिंदी वाक्यों की मूलभूत संरचना सीखें जिसमें कर्ता, क्रिया और कर्म शामिल हैं।",
                concepts: [
                    {
                        name: "कर्ता-कर्म-क्रिया",
                        explanation: "हिंदी आमतौर पर कर्ता-कर्म-क्रिया (SOV) क्रम का पालन करती है",
                        examples: [
                            "मैं सेब खाता हूँ।",
                            "वह किताब पढ़ती है।",
                            "वे फुटबॉल खेलते हैं।"
                        ],
                        rules: [
                            "कर्ता पहले आता है",
                            "कर्म दूसरे स्थान पर आता है",
                            "क्रिया अंत में आती है"
                        ]
                    },
                    {
                        name: "क्रिया का लिंग",
                        explanation: "क्रिया कर्ता के लिंग के अनुसार बदलती है",
                        examples: [
                            "लड़का खेलता है। (पुल्लिंग)",
                            "लड़की खेलती है। (स्त्रीलिंग)",
                            "बच्चे खेलते हैं। (बहुवचन)"
                        ],
                        rules: [
                            "पुल्लिंग कर्ता के लिए 'ता' प्रत्यय",
                            "स्त्रीलिंग कर्ता के लिए 'ती' प्रत्यय",
                            "बहुवचन कर्ता के लिए 'ते' प्रत्यय"
                        ]
                    }
                ],
                exercises: [
                    {
                        type: 'sentence-formation',
                        question: 'सही वाक्य चुनें: मैं / खाता हूँ / सेब',
                        options: ['मैं सेब खाता हूँ', 'खाता हूँ मैं सेब', 'सेब मैं खाता हूँ'],
                        answer: 'मैं सेब खाता हूँ',
                        explanation: 'सही SOV क्रम: कर्ता (मैं) + कर्म (सेब) + क्रिया (खाता हूँ)',
                        audioText: 'मैं सेब खाता हूँ'
                    },
                    {
                        type: 'verb-conjugation',
                        question: 'वह लड़की ___ (खेलना)',
                        options: ['खेलता है', 'खेलती है', 'खेलते हैं'],
                        answer: 'खेलती है',
                        explanation: 'स्त्रीलिंग कर्ता के लिए "ती" प्रत्यय का प्रयोग',
                        audioText: 'वह लड़की खेलती है'
                    },
                    {
                        type: 'word-order',
                        question: 'सही क्रम चुनें: पढ़ती है / वह / किताब',
                        options: ['वह किताब पढ़ती है', 'पढ़ती है वह किताब', 'किताब वह पढ़ती है'],
                        answer: 'वह किताब पढ़ती है',
                        explanation: 'कर्ता (वह) + कर्म (किताब) + क्रिया (पढ़ती है)',
                        audioText: 'वह किताब पढ़ती है'
                    }
                ],
                practiceSentences: [
                    "लड़का गेंद से खेलता है।",
                    "एक सेब पेड़ से गिरता है।",
                    "हम शाम सात बजे खाना खाते हैं।",
                    "वह अपनी नोटबुक में लिखती है।",
                    "वे रोज टेलीविजन देखते हैं।"
                ],
                tips: [
                    "हिंदी वाक्यों में क्रिया अंत में आती है",
                    "क्रिया कर्ता के लिंग और वचन के अनुसार बदलती है",
                    "सरल वाक्यों से अभ्यास शुरू करें"
                ]
            },
            {
                id: 'hi-grammar-2',
                title: "वर्तमान काल",
                content: "वर्तमान काल की क्रियाओं का वर्तमान क्रियाओं और सामान्य सत्यों के लिए उपयोग सीखें।",
                concepts: [
                    {
                        name: "सामान्य वर्तमान",
                        explanation: "आदतों, सामान्य सत्यों और निश्चित व्यवस्थाओं के लिए प्रयोग किया जाता है",
                        examples: [
                            "मैं रोज काम करता हूँ।",
                            "सूरज पूरब में निकलता है।",
                            "वह अच्छी हिंदी बोलती है।"
                        ],
                        rules: [
                            "कर्ता के अनुसार क्रिया बदलती है",
                            "आदतों और स्थायी स्थितियों के लिए प्रयोग",
                            "सामान्य सत्य व्यक्त करने के लिए प्रयोग"
                        ]
                    },
                    {
                        name: "अपूर्ण वर्तमान",
                        explanation: "अभी हो रही क्रियाओं या अस्थायी स्थितियों के लिए प्रयोग किया जाता है",
                        examples: [
                            "मैं किताब पढ़ रहा हूँ।",
                            "वे बाहर खेल रहे हैं।",
                            "वह खाना बना रही है।"
                        ],
                        rules: [
                            "रहा/रही/रहे + हूँ/है/हैं का प्रयोग",
                            "अस्थायी क्रियाओं के लिए प्रयोग",
                            "बदलती हुई स्थितियों के लिए प्रयोग"
                        ]
                    }
                ],
                exercises: [
                    {
                        type: 'verb-conjugation',
                        question: 'वह दफ्तर में ___ (काम) करता है।',
                        options: ['काम', 'कामों', 'काम का'],
                        answer: 'काम',
                        explanation: 'क्रिया "करता है" के साथ "काम" सही प्रयोग',
                        audioText: 'वह दफ्तर में काम करता है'
                    },
                    {
                        type: 'tense-choice',
                        question: 'अभी, मैं ___ (पढ़ना) एक किताब।',
                        options: ['पढ़ रहा हूँ', 'पढ़ता हूँ', 'पढ़ा हूँ'],
                        answer: 'पढ़ रहा हूँ',
                        explanation: 'अभी हो रही क्रिया के लिए अपूर्ण वर्तमान का प्रयोग',
                        audioText: 'मैं पढ़ रहा हूँ'
                    },
                    {
                        type: 'sentence-correction',
                        question: 'सही करें: वह स्कूल जाती।',
                        options: ['वह स्कूल जाती है', 'वह स्कूल जा रही है', 'वह स्कूल जाएगी'],
                        answer: 'वह स्कूल जाती है',
                        explanation: 'सामान्य वर्तमान में "है" का प्रयोग आवश्यक है',
                        audioText: 'वह स्कूल जाती है'
                    }
                ],
                practiceSentences: [
                    "हम सुबह हिंदी पढ़ते हैं।",
                    "वह अभी टीवी देख रहा है।",
                    "पक्षी आकाश में उड़ते हैं।",
                    "मैं अभी व्याकरण सीख रहा हूँ।",
                    "पानी 100 डिग्री पर उबलता है।"
                ],
                tips: [
                    "सामान्य वर्तमान आदतों और सत्यों के लिए प्रयोग करें",
                    "अपूर्ण वर्तमान अभी हो रही क्रियाओं के लिए प्रयोग करें",
                    "क्रिया कर्ता के लिंग और वचन के अनुसार बदलती है"
                ]
            },
            {
                id: 'hi-grammar-3',
                title: "प्रश्न और नकारात्मक वाक्य",
                content: "हिंदी में प्रश्न और नकारात्मक वाक्य कैसे बनाएं सीखें।",
                concepts: [
                    {
                        name: "हाँ/नहीं प्रश्न",
                        explanation: "हाँ या नहीं में उत्तर दिए जा सकने वाले प्रश्न",
                        examples: [
                            "क्या आपको कॉफी पसंद है?",
                            "क्या वह आ रही है?",
                            "क्या वे तैयार हैं?"
                        ],
                      rules: [
    'प्रश्नवाचक शब्द "क्या" का प्रयोग',
    'क्रिया के रूप में परिवर्तन',
    'वाक्य के अंत में प्रश्नवाचक चिह्न'
]

                    },
                    {
                        name: "नकारात्मक वाक्य",
                        explanation: "नकारात्मकता व्यक्त करने वाले वाक्य",
                        examples: [
                            "मुझे चाय पसंद नहीं है।",
                            "वह आज काम नहीं कर रही है।",
                            "वे फुटबॉल नहीं खेलते हैं।"
                        ],
                        rules: [
                            "नहीं का प्रयोग क्रिया से पहले",
                            "क्रिया के रूप में परिवर्तन",
                            "संक्षिप्त रूपों का प्रयोग"
                        ]
                    }
                ],
                exercises: [
                    {
                        type: 'question-formation',
                        question: 'प्रश्न बनाएं: वह हिंदी बोलती है।',
                        options: ['क्या वह हिंदी बोलती है?', 'क्या वह हिंदी बोलता है?', 'क्या वह हिंदी बोल रही है?'],
                        answer: 'क्या वह हिंदी बोलती है?',
                        explanation: 'सामान्य वर्तमान प्रश्न के लिए "क्या" का प्रयोग',
                        audioText: 'क्या वह हिंदी बोलती है'
                    },
                    {
                        type: 'negative-formation',
                        question: 'नकारात्मक बनाएं: मुझे कॉफी पसंद है।',
                        options: ['मुझे कॉफी पसंद नहीं है', 'मुझे कॉफी नहीं पसंद है', 'मैं कॉफी पसंद नहीं करता'],
                        answer: 'मुझे कॉफी पसंद नहीं है',
                        explanation: '"पसंद नहीं है" सही नकारात्मक रूप है',
                        audioText: 'मुझे कॉफी पसंद नहीं है'
                    },
                    {
                        type: 'sentence-completion',
                        question: '___ आपको यह पाठ समझ आता है?',
                        options: ['क्या', 'क्यों', 'कब'],
                        answer: 'क्या',
                        explanation: 'हाँ/नहीं प्रश्नों के लिए "क्या" का प्रयोग',
                        audioText: 'क्या आपको यह पाठ समझ आता है'
                    }
                ],
                practiceSentences: [
                    "क्या वे यहाँ रहते हैं?",
                    "वह रविवार को काम नहीं करती है।",
                    "क्या आप मेरी बात सुन रहे हैं?",
                    "मैं पार्टी में नहीं जा रहा हूँ।",
                    "क्या उसे पिज्जा पसंद है?"
                ],
                tips: [
    "प्रश्नवाचक \"क्या\" का सही प्रयोग सीखें",
    "नकारात्मक वाक्यों में \"नहीं\" का स्थान याद रखें",
    "पूर्ण और संक्षिप्त नकारात्मक रूपों का अभ्यास करें"
]

            }
        ]
    },

    fr: {
        title: "Grammaire Française",
        lessons: [
            {
                id: 'fr-grammar-1',
                title: "Structure de Base de la Phrase",
                content: "Apprenez la structure fondamentale des phrases françaises incluant les sujets, les verbes et les objets.",
                concepts: [
                    {
                        name: "Sujet-Verbe-Objet",
                        explanation: "Le français suit généralement l'ordre Sujet-Verbe-Objet (SVO)",
                        examples: [
                            "Je mange une pomme.",
                            "Elle lit un livre.",
                            "Ils jouent au football."
                        ],
                        rules: [
                            "Le sujet vient en premier",
                            "Le verbe vient en deuxième",
                            "L'objet vient en dernier"
                        ]
                    },
                    {
                        name: "Articles",
                        explanation: "Un, une, le, la, les sont utilisés avant les noms",
                        examples: [
                            "Un chat (n'importe quel chat)",
                            "Une pomme (féminin)",
                            "Le soleil (soleil spécifique)"
                        ],
                        rules: [
                            "Utilisez 'un' pour les noms masculins",
                            "Utilisez 'une' pour les noms féminins", 
                            "Utilisez 'le/la/les' pour les choses spécifiques"
                        ]
                    }
                ],
                exercises: [
                    {
                        type: 'sentence-formation',
                        question: 'Formez une phrase avec: Je / mange / une pomme',
                        options: ['Je une pomme mange', 'Mange je une pomme', 'Je mange une pomme'],
                        answer: 'Je mange une pomme',
                        explanation: 'Ordre SVO correct: Sujet (Je) + Verbe (mange) + Objet (une pomme)',
                        audioText: 'Je mange une pomme'
                    },
                    {
                        type: 'article-choice',
                        question: 'Choisissez le bon article: ___ pomme',
                        options: ['un', 'une', 'la'],
                        answer: 'une',
                        explanation: 'Pomme est féminin, donc on utilise "une"',
                        audioText: 'une pomme'
                    },
                    {
                        type: 'word-order',
                        question: 'Choisissez le bon ordre: lit / Elle / un livre',
                        options: ['Elle lit un livre', 'Lit elle un livre', 'Un livre elle lit'],
                        answer: 'Elle lit un livre',
                        explanation: 'Sujet (Elle) + Verbe (lit) + Objet (un livre)',
                        audioText: 'Elle lit un livre'
                    }
                ],
                practiceSentences: [
                    "Le garçon joue avec un ballon.",
                    "Une pomme tombe de l'arbre.",
                    "Nous mangeons le dîner à sept heures.",
                    "Elle écrit dans son cahier.",
                    "Ils regardent la télévision tous les jours."
                ],
                tips: [
                    "Rappelez-vous l'ordre SVO: Sujet d'abord, puis verbe, puis objet",
                    "Pratiquez avec des phrases simples d'abord",
                    "Lisez des livres français pour voir les modèles de phrases"
                ]
            }
        ]
    },

    de: {
        title: "Deutsche Grammatik",
        lessons: [
            {
                id: 'de-grammar-1',
                title: "Grundlegende Satzstruktur",
                content: "Lernen Sie die grundlegende Struktur deutscher Sätze einschließlich Subjekte, Verben und Objekte.",
                concepts: [
                    {
                        name: "Subjekt-Verb-Objekt",
                        explanation: "Deutsch folgt typischerweise der Subjekt-Verb-Objekt (SVO) Reihenfolge",
                        examples: [
                            "Ich esse einen Apfel.",
                            "Sie liest ein Buch.",
                            "Sie spielen Fußball."
                        ],
                        rules: [
                            "Das Subjekt kommt zuerst",
                            "Das Verb kommt an zweiter Stelle",
                            "Das Objekt kommt am Ende"
                        ]
                    },
                    {
                        name: "Artikel",
                        explanation: "Ein, eine, der, die, das werden vor Nomen verwendet",
                        examples: [
                            "Ein Apfel (irgendein Apfel)",
                            "Eine Katze (weiblich)",
                            "Der Mond (spezifischer Mond)"
                        ],
                        rules: [
                            "Verwenden Sie 'ein' für männliche Nomen",
                            "Verwenden Sie 'eine' für weibliche Nomen",
                            "Verwenden Sie 'der/die/das' für spezifische Dinge"
                        ]
                    }
                ],
                exercises: [
                    {
                        type: 'sentence-formation',
                        question: 'Bilden Sie einen Satz mit: Ich / esse / einen Apfel',
                        options: ['Ich einen Apfel esse', 'Esse ich einen Apfel', 'Ich esse einen Apfel'],
                        answer: 'Ich esse einen Apfel',
                        explanation: 'Korrekte SVO-Reihenfolge: Subjekt (Ich) + Verb (esse) + Objekt (einen Apfel)',
                        audioText: 'Ich esse einen Apfel'
                    },
                    {
                        type: 'article-choice',
                        question: 'Wählen Sie den richtigen Artikel: ___ Katze',
                        options: ['ein', 'eine', 'die'],
                        answer: 'eine',
                        explanation: 'Katze ist feminin, also verwendet man "eine"',
                        audioText: 'eine Katze'
                    },
                    {
                        type: 'word-order',
                        question: 'Wählen Sie die richtige Reihenfolge: liest / Sie / ein Buch',
                        options: ['Sie liest ein Buch', 'Liest sie ein Buch', 'Ein Buch sie liest'],
                        answer: 'Sie liest ein Buch',
                        explanation: 'Subjekt (Sie) + Verb (liest) + Objekt (ein Buch)',
                        audioText: 'Sie liest ein Buch'
                    }
                ],
                practiceSentences: [
                    "Der Junge spielt mit einem Ball.",
                    "Ein Apfel fällt vom Baum.",
                    "Wir essen Abendessen um sieben Uhr.",
                    "Sie schreibt in ihr Heft.",
                    "Sie schauen jeden Tag Fernsehen."
                ],
                tips: [
                    "Merken Sie sich die SVO-Reihenfolge: Subjekt zuerst, dann Verb, dann Objekt",
                    "Üben Sie zuerst mit einfachen Sätzen",
                    "Lesen Sie deutsche Bücher, um Satzmuster zu sehen"
                ]
            }
        ]
    }
},

// ========== ASSESSMENT MODULE ==========
assessment : {
    en: {
        title: "English Assessment",
        lessons: [
            {
                id: 'en-assessment-1',
                title: "Beginner Level Test",
                content: "Test your basic English knowledge with this comprehensive beginner assessment.",
                sections: [
                    {
                        name: "Vocabulary",
                        questions: [
                            {
                                type: 'multiple-choice',
                                question: "What is the opposite of 'big'?",
                                options: ['Small', 'Large', 'Huge', 'Great'],
                                answer: 'Small',
                                explanation: "The opposite of big is small"
                            },
                            {
                                type: 'matching',
                                question: "Match the color with its name:",
                                pairs: [
                                    { item: '🔴', options: ['Red', 'Blue', 'Green'] },
                                    { item: '🔵', options: ['Blue', 'Red', 'Yellow'] },
                                    { item: '🟢', options: ['Green', 'Blue', 'Red'] }
                                ],
                                answer: ['Red', 'Blue', 'Green'],
                                explanation: "Red is 🔴, Blue is 🔵, Green is 🟢"
                            }
                        ]
                    },
                    {
                        name: "Grammar",
                        questions: [
                            {
                                type: 'fill-blank',
                                question: "I ___ (to be) a student.",
                                options: ['am', 'is', 'are', 'be'],
                                answer: 'am',
                                explanation: "With 'I', we use 'am'"
                            },
                            {
                                type: 'sentence-correction',
                                question: "She go to school every day.",
                                options: [
                                    "She goes to school every day.",
                                    "She going to school every day.", 
                                    "She is go to school every day."
                                ],
                                answer: "She goes to school every day.",
                                explanation: "Third person singular requires 'goes'"
                            }
                        ]
                    },
                    {
                        name: "Reading Comprehension",
                        questions: [
                            {
                                type: 'comprehension',
                                passage: "Tom is a boy. He is seven years old. He goes to school every day. He likes to play with his friends. After school, he does his homework.",
                                questions: [
                                    {
                                        question: "How old is Tom?",
                                        options: ['5 years', '7 years', '10 years', '12 years'],
                                        answer: '7 years'
                                    },
                                    {
                                        question: "What does Tom do after school?",
                                        options: ['Plays games', 'Does homework', 'Watches TV', 'Reads books'],
                                        answer: 'Does homework'
                                    }
                                ],
                                answer: ['7 years', 'Does homework']
                            }
                        ]
                    }
                ],
                scoring: {
                    totalPoints: 100,
                    passingScore: 70,
                    timeLimit: 30 // minutes
                },
                feedback: {
                    excellent: "Great job! You have a strong foundation in basic English.",
                    good: "Good work! You understand the basics well.",
                    average: "You have some understanding but need more practice.",
                    poor: "Keep practicing! Review the beginner lessons again."
                }
            },
            {
                id: 'en-assessment-2',
                title: "Intermediate Level Test", 
                content: "Test your intermediate English skills with more complex questions.",
                sections: [
                    {
                        name: "Advanced Vocabulary",
                        questions: [
                            {
                                type: 'synonym',
                                question: "What is a synonym for 'happy'?",
                                options: ['Joyful', 'Sad', 'Angry', 'Tired'],
                                answer: 'Joyful',
                                explanation: "Joyful means the same as happy"
                            },
                            {
                                type: 'antonym', 
                                question: "What is the antonym of 'generous'?",
                                options: ['Selfish', 'Kind', 'Friendly', 'Helpful'],
                                answer: 'Selfish',
                                explanation: "Selfish is the opposite of generous"
                            }
                        ]
                    },
                    {
                        name: "Complex Grammar",
                        questions: [
                            {
                                type: 'tense-identification',
                                question: "What tense is: 'I have been studying for two hours'?",
                                options: ['Present Perfect Continuous', 'Past Perfect', 'Simple Present', 'Future Continuous'],
                                answer: 'Present Perfect Continuous',
                                explanation: "This is present perfect continuous tense"
                            },
                            {
                                type: 'sentence-combining',
                                question: "Combine: 'I was tired. I went to bed early.'",
                                options: [
                                    "I was tired, so I went to bed early.",
                                    "I was tired but I went to bed early.",
                                    "I was tired because I went to bed early."
                                ],
                                answer: "I was tired, so I went to bed early.",
                                explanation: "'So' shows the result of being tired"
                            }
                        ]
                    }
                ],
                scoring: {
                    totalPoints: 100,
                    passingScore: 75,
                    timeLimit: 45
                },
                feedback: {
                    excellent: "Excellent! Your intermediate English skills are impressive.",
                    good: "Well done! You have good intermediate knowledge.",
                    average: "You're making progress. Keep practicing intermediate concepts.",
                    poor: "Review intermediate lessons and try again."
                }
            }
        ]
    },

    ta: {
        title: "தமிழ் மதிப்பீடு",
        lessons: [
            {
                id: 'ta-assessment-1',
                title: "தொடக்க நிலை சோதனை",
                content: "உங்கள் அடிப்படை தமிழ் அறிவை இந்த விரிவான தொடக்க நிலை மதிப்பீடு மூலம் சோதிக்கவும்.",
                sections: [
                    {
                        name: "சொல்லகராதி",
                        questions: [
                            {
                                type: 'multiple-choice',
                                question: "'பெரிய' என்பதன் எதிர்ச்சொல் என்ன?",
                                options: ['சிறிய', 'பெரிதான', 'மிகப்பெரிய', 'நல்ல'],
                                answer: 'சிறிய',
                                explanation: "பெரிய என்பதன் எதிர்ச்சொல் சிறிய"
                            },
                            {
                                type: 'matching',
                                question: "நிறத்தை அதன் பெயருடன் பொருத்தவும்:",
                                pairs: [
                                    { item: '🔴', options: ['சிவப்பு', 'நீலம்', 'பச்சை'] },
                                    { item: '🔵', options: ['நீலம்', 'சிவப்பு', 'மஞ்சள்'] },
                                    { item: '🟢', options: ['பச்சை', 'நீலம்', 'சிவப்பு'] }
                                ],
                                answer: ['சிவப்பு', 'நீலம்', 'பச்சை'],
                                explanation: "சிவப்பு = 🔴, நீலம் = 🔵, பச்சை = 🟢"
                            }
                        ]
                    },
                    {
                        name: "இலக்கணம்",
                        questions: [
                            {
                                type: 'fill-blank',
                                question: "நான் ___ மாணவன்.",
                                options: ['ஒரு', 'ஓர்', 'சில', 'பல'],
                                answer: 'ஒரு',
                                explanation: "'மாணவன்' முன் 'ஒரு' பயன்படுத்தப்படும்"
                            },
                            {
                                type: 'sentence-correction',
                                question: "அவள் பள்ளி செல்றாள்.",
                                options: [
                                    "அவள் பள்ளி செல்கிறாள்.",
                                    "அவள் பள்ளி சென்றாள்.",
                                    "அவள் பள்ளி செல்வாள்."
                                ],
                                answer: "அவள் பள்ளி செல்கிறாள்.",
                                explanation: "நிகழ்காலத்தில் 'செல்கிறாள்' சரியான வடிவம்"
                            }
                        ]
                    },
                    {
                        name: "படிப்பறிவு",
                        questions: [
                            {
                                type: 'comprehension',
                                passage: "ராமன் ஒரு சிறுவன். அவனுக்கு ஏழு வயது. அவன் தினமும் பள்ளிக்குச் செல்கிறான். அவன் தன் நண்பர்களுடன் விளையாட விரும்புகிறான். பள்ளியில் இருந்து வந்த பிறகு, அவன் தன் வீட்டுப்பாடம் செய்கிறான்.",
                                questions: [
                                    {
                                        question: "ராமனுக்கு எத்தனை வயது?",
                                        options: ['5 வயது', '7 வயது', '10 வயது', '12 வயது'],
                                        answer: '7 வயது'
                                    },
                                    {
                                        question: "ராமன் பள்ளியில் இருந்து வந்த பிறகு என்ன செய்கிறான்?",
                                        options: ['விளையாடுகிறான்', 'வீட்டுப்பாடம் செய்கிறான்', 'டிவி பார்க்கிறான்', 'புத்தகம் படிக்கிறான்'],
                                        answer: 'வீட்டுப்பாடம் செய்கிறான்'
                                    }
                                ],
                                answer: ['7 வயது', 'வீட்டுப்பாடம் செய்கிறான்']
                            }
                        ]
                    }
                ],
                scoring: {
                    totalPoints: 100,
                    passingScore: 70,
                    timeLimit: 30
                },
                feedback: {
                    excellent: "அருமை! உங்களுக்கு அடிப்படை தமிழில் வலுவான அடித்தளம் உள்ளது.",
                    good: "நல்ல வேலை! நீங்கள் அடிப்படைகளை நன்றாக புரிந்துள்ளீர்கள்.",
                    average: "உங்களுக்கு சில விஷயங்கள் புரிகின்றன, ஆனால் மேலும் பயிற்சி தேவை.",
                    poor: "தொடர்ந்து பயிற்சி செய்யுங்கள்! தொடக்க நிலை பாடங்களை மீண்டும் மதிப்பாய்வு செய்யுங்கள்."
                }
            }
        ]
    },

    hi: {
        title: "हिंदी मूल्यांकन",
        lessons: [
            {
                id: 'hi-assessment-1',
                title: "शुरुआती स्तर की परीक्षा",
                content: "इस व्यापक शुरुआती मूल्यांकन के साथ अपने बुनियादी हिंदी ज्ञान का परीक्षण करें।",
                sections: [
                    {
                        name: "शब्दावली",
                        questions: [
                            {
                                type: 'multiple-choice',
                                question: "'बड़ा' का विलोम क्या है?",
                                options: ['छोटा', 'बड़ा', 'विशाल', 'महान'],
                                answer: 'छोटा',
                                explanation: "'बड़ा' का विलोम 'छोटा' है"
                            },
                            {
                                type: 'matching',
                                question: "रंग को उसके नाम से मिलाएं:",
                                pairs: [
                                    { item: '🔴', options: ['लाल', 'नीला', 'हरा'] },
                                    { item: '🔵', options: ['नीला', 'लाल', 'पीला'] },
                                    { item: '🟢', options: ['हरा', 'नीला', 'लाल'] }
                                ],
                                answer: ['लाल', 'नीला', 'हरा'],
                                explanation: "लाल = 🔴, नीला = 🔵, हरा = 🟢"
                            }
                        ]
                    },
                    {
                        name: "व्याकरण",
                        questions: [
                            {
                                type: 'fill-blank',
                                question: "मैं ___ छात्र हूँ।",
                                options: ['एक', 'कोई', 'कुछ', 'बहुत'],
                                answer: 'एक',
                                explanation: "'छात्र' से पहले 'एक' का प्रयोग होता है"
                            },
                            {
                                type: 'sentence-correction',
                                question: "वह स्कूल जाती।",
                                options: [
                                    "वह स्कूल जाती है।",
                                    "वह स्कूल जा रही है।",
                                    "वह स्कूल जाएगी।"
                                ],
                                answer: "वह स्कूल जाती है।",
                                explanation: "वर्तमान काल में 'है' का प्रयोग आवश्यक है"
                            }
                        ]
                    },
                    {
                        name: "पढ़ने की समझ",
                        questions: [
                            {
                                type: 'comprehension',
                                passage: "राम एक लड़का है। उसकी उम्र सात साल है। वह रोज स्कूल जाता है। उसे अपने दोस्तों के साथ खेलना पसंद है। स्कूल से आने के बाद, वह अपना गृहकार्य करता है।",
                                questions: [
                                    {
                                        question: "राम की उम्र क्या है?",
                                        options: ['5 साल', '7 साल', '10 साल', '12 साल'],
                                        answer: '7 साल'
                                    },
                                    {
                                        question: "राम स्कूल से आने के बाद क्या करता है?",
                                        options: ['खेलता है', 'गृहकार्य करता है', 'टीवी देखता है', 'किताब पढ़ता है'],
                                        answer: 'गृहकार्य करता है'
                                    }
                                ],
                                answer: ['7 साल', 'गृहकार्य करता है']
                            }
                        ]
                    }
                ],
                scoring: {
                    totalPoints: 100,
                    passingScore: 70,
                    timeLimit: 30
                },
                feedback: {
                    excellent: "बहुत बढ़िया! आपके पास बुनियादी हिंदी में मजबूत आधार है।",
                    good: "अच्छा काम! आप मूल बातें अच्छी तरह समझते हैं।",
                    average: "आपकी कुछ समझ है लेकिन अधिक अभ्यास की आवश्यकता है।",
                    poor: "अभ्यास जारी रखें! शुरुआती पाठों को फिर से देखें।"
                }
            }
        ]
    },

    fr: {
        title: "Évaluation Française",
        lessons: [
            {
                id: 'fr-assessment-1',
                title: "Test de Niveau Débutant",
                content: "Testez vos connaissances de base en français avec cette évaluation complète pour débutants.",
                sections: [
                    {
                        name: "Vocabulaire",
                        questions: [
                            {
                                type: 'multiple-choice',
                                question: "Quel est le contraire de 'grand'?",
                                options: ['Petit', 'Large', 'Énorme', 'Super'],
                                answer: 'Petit',
                                explanation: "Le contraire de grand est petit"
                            },
                            {
                                type: 'matching',
                                question: "Associez la couleur à son nom:",
                                pairs: [
                                    { item: '🔴', options: ['Rouge', 'Bleu', 'Vert'] },
                                    { item: '🔵', options: ['Bleu', 'Rouge', 'Jaune'] },
                                    { item: '🟢', options: ['Vert', 'Bleu', 'Rouge'] }
                                ],
                                answer: ['Rouge', 'Bleu', 'Vert'],
                                explanation: "Rouge = 🔴, Bleu = 🔵, Vert = 🟢"
                            }
                        ]
                    },
                    {
                        name: "Grammaire",
                        questions: [
                            {
                                type: 'fill-blank',
                                question: "Je ___ un étudiant.",
                                options: ['suis', 'es', 'est', 'sommes'],
                                answer: 'suis',
                                explanation: "Avec 'je', on utilise 'suis'"
                            },
                            {
                                type: 'sentence-correction',
                                question: "Elle aller à l'école tous les jours.",
                                options: [
                                    "Elle va à l'école tous les jours.",
                                    "Elle allant à l'école tous les jours.",
                                    "Elle est aller à l'école tous les jours."
                                ],
                                answer: "Elle va à l'école tous les jours.",
                                explanation: "À la troisième personne du singulier, on utilise 'va'"
                            }
                        ]
                    },
                    {
                        name: "Compréhension Écrite",
                        questions: [
                            {
                                type: 'comprehension',
                                passage: "Pierre est un garçon. Il a sept ans. Il va à l'école tous les jours. Il aime jouer avec ses amis. Après l'école, il fait ses devoirs.",
                                questions: [
                                    {
                                        question: "Quel âge a Pierre?",
                                        options: ['5 ans', '7 ans', '10 ans', '12 ans'],
                                        answer: '7 ans'
                                    },
                                    {
                                        question: "Que fait Pierre après l'école?",
                                        options: ['Il joue', 'Il fait ses devoirs', 'Il regarde la télé', 'Il lit des livres'],
                                        answer: 'Il fait ses devoirs'
                                    }
                                ],
                                answer: ['7 ans', 'Il fait ses devoirs']
                            }
                        ]
                    }
                ],
                scoring: {
                    totalPoints: 100,
                    passingScore: 70,
                    timeLimit: 30
                },
                feedback: {
                    excellent: "Excellent ! Vous avez de solides bases en français.",
                    good: "Bon travail ! Vous comprenez bien les bases.",
                    average: "Vous avez une certaine compréhension mais avez besoin de plus de pratique.",
                    poor: "Continuez à pratiquer ! Revoyez les leçons pour débutants."
                }
            }
        ]
    },

    de: {
        title: "Deutsche Bewertung",
        lessons: [
            {
                id: 'de-assessment-1',
                title: "Anfänger-Level-Test",
                content: "Testen Sie Ihr grundlegendes Deutschwissen mit dieser umfassenden Anfängerbewertung.",
                sections: [
                    {
                        name: "Wortschatz",
                        questions: [
                            {
                                type: 'multiple-choice',
                                question: "Was ist das Gegenteil von 'groß'?",
                                options: ['Klein', 'Groß', 'Riesig', 'Toll'],
                                answer: 'Klein',
                                explanation: "Das Gegenteil von groß ist klein"
                            },
                            {
                                type: 'matching',
                                question: "Ordnen Sie die Farbe ihrem Namen zu:",
                                pairs: [
                                    { item: '🔴', options: ['Rot', 'Blau', 'Grün'] },
                                    { item: '🔵', options: ['Blau', 'Rot', 'Gelb'] },
                                    { item: '🟢', options: ['Grün', 'Blau', 'Rot'] }
                                ],
                                answer: ['Rot', 'Blau', 'Grün'],
                                explanation: "Rot = 🔴, Blau = 🔵, Grün = 🟢"
                            }
                        ]
                    },
                    {
                        name: "Grammatik",
                        questions: [
                            {
                                type: 'fill-blank',
                                question: "Ich ___ ein Student.",
                                options: ['bin', 'bist', 'ist', 'sind'],
                                answer: 'bin',
                                explanation: "Mit 'ich' verwenden wir 'bin'"
                            },
                            {
                                type: 'sentence-correction',
                                question: "Sie gehen zur Schule jeden Tag.",
                                options: [
                                    "Sie geht zur Schule jeden Tag.",
                                    "Sie gehend zur Schule jeden Tag.",
                                    "Sie ist gehen zur Schule jeden Tag."
                                ],
                                answer: "Sie geht zur Schule jeden Tag.",
                                explanation: "In der dritten Person Singular verwenden wir 'geht'"
                            }
                        ]
                    },
                    {
                        name: "Leseverständnis",
                        questions: [
                            {
                                type: 'comprehension',
                                passage: "Max ist ein Junge. Er ist sieben Jahre alt. Er geht jeden Tag zur Schule. Er spielt gerne mit seinen Freunden. Nach der Schule macht er seine Hausaufgaben.",
                                questions: [
                                    {
                                        question: "Wie alt ist Max?",
                                        options: ['5 Jahre', '7 Jahre', '10 Jahre', '12 Jahre'],
                                        answer: '7 Jahre'
                                    },
                                    {
                                        question: "Was macht Max nach der Schule?",
                                        options: ['Er spielt', 'Er macht Hausaufgaben', 'Er sieht fern', 'Er liest Bücher'],
                                        answer: 'Er macht Hausaufgaben'
                                    }
                                ],
                                answer: ['7 Jahre', 'Er macht Hausaufgaben']
                            }
                        ]
                    }
                ],
                scoring: {
                    totalPoints: 100,
                    passingScore: 70,
                    timeLimit: 30
                },
                feedback: {
                    excellent: "Ausgezeichnet! Sie haben eine solide Grundlage in basischem Deutsch.",
                    good: "Gute Arbeit! Sie verstehen die Grundlagen gut.",
                    average: "Sie haben etwas Verständnis, brauchen aber mehr Übung.",
                    poor: "Üben Sie weiter! Wiederholen Sie die Anfängerlektionen."
                }
            }
        ]
    }
}
        };
    }

    // Get lesson content for specific module and language
    getLesson(module, language, lessonIndex) {
    try {
        console.log(`📖 Getting lesson: ${module}/${language}/${lessonIndex}`);

        // Validate inputs
        if (!module || !language || lessonIndex === undefined) {
            throw new Error('Invalid parameters');
        }

        const moduleContent = this.curriculum[module]?.[language];
        if (!moduleContent) {
            console.error(`Module not found: ${module} for ${language}`);
            throw new Error(`Module ${module} not available for ${language}`);
        }

        const lessons = moduleContent.lessons;
        if (!lessons || lessons.length === 0) {
            throw new Error(`No lessons found for ${module}`);
        }

        const lesson = lessons[lessonIndex];
        if (!lesson) {
            console.error(`Lesson ${lessonIndex} not found in ${module}`);
            throw new Error(`Lesson ${lessonIndex} not found`);
        }

        console.log(`✅ Lesson loaded: ${lesson.title}`);

        return {
            success: true,
            lesson: lesson,
            moduleTitle: moduleContent.title,
            totalLessons: lessons.length,
            currentLesson: lessonIndex + 1
        };

    } catch (error) {
        console.error('❌ Error getting lesson:', error);
        return { 
            success: false, 
            error: error.message,
            module: module,
            language: language,
            lessonIndex: lessonIndex
        };
    }
}

    // Get all lessons for a module
    getModuleLessons(module, language) {
        const moduleContent = this.curriculum[module]?.[language];
        return moduleContent ? moduleContent.lessons : [];
    }


// Add this helper method to get journey from cache or Firebase


async updateLessonCompletion(userId, module, lessonId, score, timeSpent) {
    try {
        console.log('📊 Updating lesson completion:', {
            userId, module, lessonId, score, timeSpent
        });

        if (!userId || !module || !lessonId) {
            throw new Error('Missing required parameters');
        }

        const journeyRef = doc(db, 'userJourneys', userId);
        const journeyDoc = await getDoc(journeyRef);

        if (!journeyDoc.exists()) {
            console.log('🆕 Journey not found, creating new one');
            const initResult = await this.initializeUserJourney(userId, 'en', 'en');
            if (!initResult.success) {
                throw new Error('Failed to initialize journey');
            }
            // Retry after initialization
            return this.updateLessonCompletion(userId, module, lessonId, score, timeSpent);
        }

        const journeyData = journeyDoc.data();
        const moduleData = journeyData.modules[module];

        if (!moduleData) {
            throw new Error(`Module ${module} not found in journey`);
        }

        // Add lesson to completed list if not already there
        if (!moduleData.lessonsCompleted.includes(lessonId)) {
            moduleData.lessonsCompleted.push(lessonId);
            console.log('✅ Lesson marked as completed:', lessonId);
        } else {
            console.log('ℹ️ Lesson already completed:', lessonId);
        }

        // Get total lessons for this module
        const totalLessons = this.getModuleLessons(module, journeyData.targetLanguage).length;
        const completedCount = moduleData.lessonsCompleted.length;
        
        // Calculate module progress
        moduleData.progress = totalLessons > 0 
            ? Math.round((completedCount / totalLessons) * 100) 
            : 0;
        
        moduleData.lastAccessed = new Date().toISOString();

        console.log(`📈 Module progress: ${completedCount}/${totalLessons} (${moduleData.progress}%)`);

        // Mark module as completed if all lessons done
        if (moduleData.progress === 100 && !moduleData.completed) {
            moduleData.completed = true;
            moduleData.completedAt = new Date().toISOString();
            console.log(`🎉 Module ${module} completed!`);
        }

        // Calculate overall progress (25% per module)
        const moduleWeights = {
            alphabets: 25,
            vocabulary: 25,
            grammar: 25,
            assessment: 25
        };

        let overallProgress = 0;
        Object.entries(journeyData.modules).forEach(([modName, modData]) => {
            const weight = moduleWeights[modName] || 0;
            const contribution = (modData.progress / 100) * weight;
            overallProgress += contribution;
            console.log(`${modName}: ${modData.progress}% × ${weight}% = +${contribution.toFixed(1)}%`);
        });

        overallProgress = Math.min(100, Math.round(overallProgress));
        console.log(`🎯 Overall progress: ${overallProgress}%`);

        // Prepare updates
        const updates = {
            [`modules.${module}`]: moduleData,
            lastLessonCompleted: {
                module: module,
                lessonId: lessonId,
                score: score,
                completedAt: new Date().toISOString(),
                timeSpent: timeSpent
            },
            totalTimeSpent: (journeyData.totalTimeSpent || 0) + timeSpent,
            overallProgress: overallProgress,
            lastUpdated: new Date().toISOString()
        };

        // Check if all modules complete
        const allModulesComplete = Object.values(journeyData.modules)
            .every(m => m.completed);
        
        if (allModulesComplete) {
            updates.languageLearned = true;
            updates.completedAt = new Date().toISOString();
            console.log('🎓 All modules completed!');
        }

        // Save to Firestore
        await updateDoc(journeyRef, updates);
        console.log('💾 Progress saved to Firestore');

        // Update localStorage cache
        const updatedJourney = { ...journeyData };
        updatedJourney.modules[module] = moduleData;
        updatedJourney.overallProgress = overallProgress;
        updatedJourney.lastUpdated = updates.lastUpdated;
        localStorage.setItem(`userJourney_${userId}`, JSON.stringify(updatedJourney));
        console.log('💾 Cache updated');

        // Determine next module
        const nextModule = this.getNextModule(module);

        return {
            success: true,
            moduleProgress: moduleData.progress,
            overallProgress: overallProgress,
            moduleCompleted: moduleData.completed,
            languageLearned: allModulesComplete,
            nextModule: nextModule,
            completedLessons: completedCount,
            totalLessons: totalLessons
        };

    } catch (error) {
        console.error('❌ Error updating lesson:', error);
        return { 
            success: false, 
            error: error.message,
            details: error.stack
        };
    }
}

// REPLACE initializeUserJourney to unlock all modules
async initializeUserJourney(userId, targetLanguage, teachingLanguage) {
    try {
        console.log('🆕 Initializing new user journey for:', userId);
        
        const journeyRef = doc(db, 'userJourneys', userId);
        
        // Check if journey already exists
        const existingJourney = await getDoc(journeyRef);
        if (existingJourney.exists()) {
            console.log('✅ Journey already exists');
            return { success: true, data: existingJourney.data() };
        }
        
        const journeyData = {
            userId: userId,
            targetLanguage: targetLanguage,
            teachingLanguage: teachingLanguage,
            startedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            modules: {
                alphabets: { 
                    unlocked: true, 
                    completed: false, 
                    progress: 0, 
                    lessonsCompleted: [],
                    lastAccessed: null
                },
                vocabulary: { 
                    unlocked: true, 
                    completed: false, 
                    progress: 0, 
                    lessonsCompleted: [],
                    lastAccessed: null
                },
                grammar: { 
                    unlocked: true, 
                    completed: false, 
                    progress: 0, 
                    lessonsCompleted: [],
                    lastAccessed: null
                },
                assessment: { 
                    unlocked: true, 
                    completed: false, 
                    progress: 0, 
                    lessonsCompleted: [],
                    lastAccessed: null
                }
            },
            overallProgress: 0, // FIXED: Start at 0%
            totalTimeSpent: 0,
            lastLessonCompleted: null,
            currentStreak: 1,
            languageLearned: false
        };

        await setDoc(journeyRef, journeyData);
        
        // Also cache locally
        localStorage.setItem(`userJourney_${userId}`, JSON.stringify(journeyData));
        
        console.log('✅ User journey initialized successfully at 0%');
        return { success: true, data: journeyData };
        
    } catch (error) {
        console.error('❌ Error initializing journey:', error);
        return { success: false, error: error.message };
    }
}



// ADD this helper method after updateLessonCompletion
getNextModule(currentModule) {
    const moduleOrder = ['alphabets', 'vocabulary', 'grammar', 'assessment'];
    const currentIndex = moduleOrder.indexOf(currentModule);
    
    if (currentIndex === -1 || currentIndex === moduleOrder.length - 1) {
        return null;
    }
    
    return moduleOrder[currentIndex + 1];
}
// Add this new helper method after updateLessonCompletion
getNextModule(currentModule) {
    const moduleOrder = ['alphabets', 'vocabulary', 'grammar', 'assessment'];
    const currentIndex = moduleOrder.indexOf(currentModule);
    
    if (currentIndex === -1 || currentIndex === moduleOrder.length - 1) {
        return null; // Invalid module or last module
    }
    
    return moduleOrder[currentIndex + 1];
}

    async getUserJourney(userId) {
        try {
            const journeyRef = doc(db, 'userJourneys', userId);
            const journeyDoc = await getDoc(journeyRef);

            if (!journeyDoc.exists()) {
                return { success: false, error: 'Journey not found' };
            }

            return { success: true, data: journeyDoc.data() };
        } catch (error) {
            console.error('❌ Error getting journey:', error);
            return { success: false, error: error.message };
        }
    }

    // Enhanced method to speak example words
    speakExample(letterData, language = 'en') {
        if (!letterData || !letterData.speakText) {
            console.warn('No speakText available for:', letterData);
            return Promise.reject('No speak text available');
        }

        const textToSpeak = letterData.speakText;
        console.log('🔊 Speaking example:', textToSpeak, 'for language:', language);

        if (language === 'ta') {
            return this.speakTamilWord(textToSpeak);
        } else {
            return this.speakGenericWord(textToSpeak, { lang: this.getLanguageCode(language) });
        }
    }

    getLanguageCode(language) {
        const languageCodes = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'ta': 'ta-IN'
        };
        return languageCodes[language] || 'en-US';
    }
}

// Create singleton instance
const learningEngine = new LearningEngine();

// Export
export async function getUserJourneyWithCache(userId) {  try {
        // Try localStorage first for speed
        const cached = localStorage.getItem(`userJourney_${userId}`);
        if (cached) {
            const parsedCache = JSON.parse(cached);
            const cacheAge = Date.now() - new Date(parsedCache.lastUpdated).getTime();
            
            // Use cache if less than 5 minutes old
            if (cacheAge < 5 * 60 * 1000) {
                console.log('📦 Using cached journey data');
                return { success: true, data: parsedCache, source: 'cache' };
            }
        }

        // Fetch from Firebase
        console.log('🔄 Fetching journey from Firebase');
        const journeyRef = doc(db, 'userJourneys', userId);
        const journeyDoc = await getDoc(journeyRef);

        if (!journeyDoc.exists()) {
            return { success: false, error: 'Journey not found' };
        }

        const data = journeyDoc.data();
        
        // Update cache
        localStorage.setItem(`userJourney_${userId}`, JSON.stringify(data));
        
        return { success: true, data: data, source: 'firebase' };
    } catch (error) {
        console.error('❌ Error getting journey:', error);
        return { success: false, error: error.message };
    }
}
// learning-engine.js
export async function updateLessonCompletion(userId, module, lessonId, score, timeSpent) {
    try {
        console.log('📊 Updating lesson completion:', {
            userId, module, lessonId, score, timeSpent
        });

        if (!userId || !module || !lessonId) {
            throw new Error('Missing required parameters');
        }

        const journeyRef = doc(db, 'userJourneys', userId);
        const journeyDoc = await getDoc(journeyRef);

        if (!journeyDoc.exists()) {
            console.log('🆕 Journey not found, creating new one');
            const initResult = await this.initializeUserJourney(userId, 'en', 'en');
            if (!initResult.success) {
                throw new Error('Failed to initialize journey');
            }
            // Retry after initialization
            return this.updateLessonCompletion(userId, module, lessonId, score, timeSpent);
        }

        const journeyData = journeyDoc.data();
        const moduleData = journeyData.modules[module];

        if (!moduleData) {
            throw new Error(`Module ${module} not found in journey`);
        }

        // Add lesson to completed list if not already there
        if (!moduleData.lessonsCompleted.includes(lessonId)) {
            moduleData.lessonsCompleted.push(lessonId);
            console.log('✅ Lesson marked as completed:', lessonId);
        } else {
            console.log('ℹ️ Lesson already completed:', lessonId);
        }

        // Get total lessons for this module
        const totalLessons = this.getModuleLessons(module, journeyData.targetLanguage).length;
        const completedCount = moduleData.lessonsCompleted.length;
        
        // Calculate module progress
        moduleData.progress = totalLessons > 0 
            ? Math.round((completedCount / totalLessons) * 100) 
            : 0;
        
        moduleData.lastAccessed = new Date().toISOString();

        console.log(`📈 Module progress: ${completedCount}/${totalLessons} (${moduleData.progress}%)`);

        // Mark module as completed if all lessons done
        if (moduleData.progress === 100 && !moduleData.completed) {
            moduleData.completed = true;
            moduleData.completedAt = new Date().toISOString();
            console.log(`🎉 Module ${module} completed!`);
        }

        // Calculate overall progress (25% per module)
        const moduleWeights = {
            alphabets: 25,
            vocabulary: 25,
            grammar: 25,
            assessment: 25
        };

        let overallProgress = 0;
        Object.entries(journeyData.modules).forEach(([modName, modData]) => {
            const weight = moduleWeights[modName] || 0;
            const contribution = (modData.progress / 100) * weight;
            overallProgress += contribution;
            console.log(`${modName}: ${modData.progress}% × ${weight}% = +${contribution.toFixed(1)}%`);
        });

        overallProgress = Math.min(100, Math.round(overallProgress));
        console.log(`🎯 Overall progress: ${overallProgress}%`);

        // Prepare updates
        const updates = {
            [`modules.${module}`]: moduleData,
            lastLessonCompleted: {
                module: module,
                lessonId: lessonId,
                score: score,
                completedAt: new Date().toISOString(),
                timeSpent: timeSpent
            },
            totalTimeSpent: (journeyData.totalTimeSpent || 0) + timeSpent,
            overallProgress: overallProgress,
            lastUpdated: new Date().toISOString()
        };

        // Check if all modules complete
        const allModulesComplete = Object.values(journeyData.modules)
            .every(m => m.completed);
        
        if (allModulesComplete) {
            updates.languageLearned = true;
            updates.completedAt = new Date().toISOString();
            console.log('🎓 All modules completed!');
        }

        // Save to Firestore
        await updateDoc(journeyRef, updates);
        console.log('💾 Progress saved to Firestore');

        // Update localStorage cache
        const updatedJourney = { ...journeyData };
        updatedJourney.modules[module] = moduleData;
        updatedJourney.overallProgress = overallProgress;
        updatedJourney.lastUpdated = updates.lastUpdated;
        localStorage.setItem(`userJourney_${userId}`, JSON.stringify(updatedJourney));
        console.log('💾 Cache updated');

        // Determine next module
        const nextModule = this.getNextModule(module);

        return {
            success: true,
            moduleProgress: moduleData.progress,
            overallProgress: overallProgress,
            moduleCompleted: moduleData.completed,
            languageLearned: allModulesComplete,
            nextModule: nextModule,
            completedLessons: completedCount,
            totalLessons: totalLessons
        };

    } catch (error) {
        console.error('❌ Error updating lesson:', error);
        return { 
            success: false, 
            error: error.message,
            details: error.stack
        };
    }
}

export default learningEngine;

console.log('✅ Learning Engine loaded with complete curriculum and pronunciations');