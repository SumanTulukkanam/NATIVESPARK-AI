import { 
    auth, 
    db, 
    googleProvider, 
    signInWithPopup, 
    onAuthStateChanged,
    signOut,
    doc,
    setDoc,
    getDoc
} from '../config/firebase-config.js';

class FirebaseAuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.isInitializing = false;
        this.lastAuthState = null;
        
        this.initializeAuthListener();
    }

    initializeAuthListener() {
        onAuthStateChanged(auth, (user) => {
            // Prevent unnecessary state changes
            const userChanged = this.lastAuthState?.uid !== user?.uid;
            this.lastAuthState = user;
            
            if (userChanged) {
                console.log('🔄 Auth state changed:', user ? user.email : 'No user');
                this.currentUser = user;
                
                if (user && !this.isInitializing) {
                    this.isInitializing = true;
                    this.handleUserSignIn(user).finally(() => {
                        this.isInitializing = false;
                    });
                } else if (!user) {
                    this.handleUserSignOut();
                }
                
                this.notifyAuthStateChange(user);
            }
        });
    }

    // In the handleUserSignIn method, add:
async handleUserSignIn(user) {
    try {
        console.log('👤 Handling user sign in:', user.email);
        
        // Store auth state for cross-page sharing
        localStorage.setItem('userAuthenticated', 'true');
        sessionStorage.setItem('currentUserEmail', user.email);
        sessionStorage.setItem('currentUserId', user.uid);
        
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            await this.createUserProfile(user);
            console.log('✅ New user profile created');
        } else {
            console.log('📋 Existing user profile found');
            await this.updateUserLastLogin(user.uid);
        }
        
    } catch (error) {
        console.error('❌ Error handling user sign in:', error);
    }
}

    async createUserProfile(user) {
        const userProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            teachingLanguage: 'en',
            targetLanguage: 'en',
            level: 'beginner',
            aiLearningStyle: 'adaptive',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            profileComplete: false, // Set to false initially
            preferences: {
                dailyGoal: 30,
                difficulty: 'adaptive',
                notifications: true,
                soundEffects: true
            },
            progress: {
                overall: 0,
                lessonsCompleted: 0,
                currentStreak: 0,
                totalXp: 0,
                daysLearning: 1
            },
            modules: {
                alphabets: { completed: false, progress: 0, locked: false },
                vocabulary: { completed: false, progress: 0, locked: true },
                grammar: { completed: false, progress: 0, locked: true },
                assessment: { completed: false, progress: 0, locked: true }
            }
        };

        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, userProfile);
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }

    async updateUserLastLogin(uid) {
        try {
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, {
                lastLogin: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }

    async initializeAILearningSession(uid) {
        console.log('🧠 Initializing AI learning session for user:', uid);
        
        try {
            const response = await fetch('http://localhost:8000/api/v1/analyze/initialize-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: uid,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ AI session initialized:', data);
            }
        } catch (error) {
            console.warn('AI session initialization failed, continuing offline:', error);
        }
    }

    handleUserSignOut() {
        console.log('👋 User signed out, cleaning up session');
        localStorage.removeItem('currentAISession');
        sessionStorage.clear();
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            this.currentUser = result.user;
            await this.handleUserSignIn(result.user);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Google sign-in error:', error);
            return { 
                success: false, 
                error: this.getFriendlyAuthError(error) 
            };
        }
    }

    async signOutUser() {
        try {
            await signOut(auth);
            this.currentUser = null;
            this.handleUserSignOut();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        
        if (this.currentUser) {
            callback(this.currentUser);
        }
        
        return () => {
            this.authStateListeners = this.authStateListeners.filter(
                listener => listener !== callback
            );
        };
    }

    notifyAuthStateChange(user) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth state listener error:', error);
            }
        });
    }

    getFriendlyAuthError(error) {
        const errorMap = {
            'auth/popup-closed-by-user': 'Sign-in was cancelled.',
            'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/operation-not-allowed': 'Sign-in method is not enabled.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'This email is already registered.'
        };
        
        return errorMap[error.code] || 'An unexpected error occurred. Please try again.';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    async getUserProfile() {
        if (!this.currentUser) return null;
        
        try {
            const userRef = doc(db, 'users', this.currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    async updateUserPreferences(preferences) {
        if (!this.currentUser) return false;
        
        try {
            const userRef = doc(db, 'users', this.currentUser.uid);
            await setDoc(userRef, { preferences }, { merge: true });
            console.log('✅ User preferences updated');
            return true;
        } catch (error) {
            console.error('Error updating preferences:', error);
            return false;
        }
    }

    async isProfileComplete() {
        try {
            const profile = await this.getUserProfile();
            return profile && profile.profileComplete === true;
        } catch (error) {
            console.error('Error checking profile completion:', error);
            return false;
        }
    }
}

const authManager = new FirebaseAuthManager();

if (typeof window !== 'undefined') {
    window.authManager = authManager;
}

export default authManager;