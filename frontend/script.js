// ============================================================
// FIREBASE IMPORTS
// ============================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

// Replace these values with the firebaseConfig
// from your Firebase console.

const firebaseConfig = {
  apiKey: "AIzaSyCphf3oxw8Fu4V9Ii8OwvHO69vjitSrp8M",
  authDomain: "careercopilot-9c227.firebaseapp.com",
  projectId: "careercopilot-9c227",
  storageBucket: "careercopilot-9c227.firebasestorage.app",
  messagingSenderId: "137943103617",
  appId: "1:137943103617:web:cd34c6eda65f0e91b2f580",
  measurementId: "G-R8KYLFX41M"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ============================================================
// SCREEN MANAGEMENT
// ============================================================

let currentScreen = "login";


function updateContainerHeight() {

    const container =
        document.getElementById("screenContainer");

    const activeScreen =
        document.querySelector(".screen.active");

    if (!container || !activeScreen) return;

    container.style.height =
        activeScreen.scrollHeight + "px";
}


function showScreen(screenName) {

    if (screenName === currentScreen) return;

    const current =
        document.getElementById(
            currentScreen + "Screen"
        );

    const next =
        document.getElementById(
            screenName + "Screen"
        );

    if (!current || !next) return;

    const direction =
        screenName === "login" &&
        currentScreen !== "login"
            ? "back"
            : "forward";


    if (direction === "forward") {

        next.style.transform =
            "translateX(35px)";

    } else {

        next.style.transform =
            "translateX(-35px)";
    }


    next.style.opacity = "0";
    next.style.visibility = "hidden";


    current.classList.remove("active");


    if (direction === "forward") {

        current.classList.add("exit-left");

    } else {

        current.classList.add("exit-right");
    }


    next.classList.add("active");


    void next.offsetWidth;


    next.style.transform =
        "translateX(0)";

    next.style.opacity = "1";
    next.style.visibility = "visible";


    setTimeout(() => {

        current.classList.remove(
            "exit-left",
            "exit-right"
        );

        current.style.transform = "";
        current.style.opacity = "";
        current.style.visibility = "";

    }, 450);


    currentScreen = screenName;

    clearMessages();

    setTimeout(
        updateContainerHeight,
        50
    );
}


// ============================================================
// PASSWORD TOGGLE
// ============================================================

function togglePassword(inputId, button) {

    const input =
        document.getElementById(inputId);

    if (!input) return;


    if (input.type === "password") {

        input.type = "text";

        button.textContent = "Hide";

    } else {

        input.type = "password";

        button.textContent = "Show";
    }
}


// ============================================================
// LOGIN
// ============================================================

async function login(event) {

    event.preventDefault();

    clearMessages();


    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    const message =
        document.getElementById(
            "loginMessage"
        );


    if (email === "" || password === "") {

        showMessage(
            message,
            "Please enter your email and password.",
            "error"
        );

        return;
    }


    try {

        // Firebase login
        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        console.log(
            "Firebase Login successful:",
            user.uid
        );


        showMessage(
            message,
            "Login successful! Redirecting...",
            "success"
        );


        // Give the success message a moment
        // to appear before redirecting.
        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 800);


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        showMessage(
            message,
            getFirebaseErrorMessage(error),
            "error"
        );
    }
}


// ============================================================
// SIGNUP
// ============================================================

async function signup(event) {

    event.preventDefault();

    clearMessages();


    const name =
        document
            .getElementById("signupName")
            .value
            .trim();

    const email =
        document
            .getElementById("signupEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("signupPassword")
            .value;

    const confirmPassword =
        document
            .getElementById("confirmPassword")
            .value;

    const message =
        document.getElementById(
            "signupMessage"
        );


    // ----------------------------------------
    // VALIDATION
    // ----------------------------------------

    if (name === "") {

        showMessage(
            message,
            "Please enter your full name.",
            "error"
        );

        return;
    }


    if (email === "") {

        showMessage(
            message,
            "Please enter your email address.",
            "error"
        );

        return;
    }


    if (password !== confirmPassword) {

        showMessage(
            message,
            "Passwords do not match.",
            "error"
        );

        return;
    }


    if (password.length < 8) {

        showMessage(
            message,
            "Password must contain at least 8 characters.",
            "error"
        );

        return;
    }


    try {

        // ----------------------------------------
        // CREATE FIREBASE ACCOUNT
        // ----------------------------------------

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        // ----------------------------------------
        // SAVE NAME TO FIREBASE AUTH PROFILE
        // ----------------------------------------

        await updateProfile(
            user,
            {
                displayName: name
            }
        );


        // ----------------------------------------
        // SAVE USER TO FIRESTORE
        // ----------------------------------------

        await setDoc(
            doc(db, "users", user.uid),
            {
                uid: user.uid,
                fullName: name,
                email: email,
                createdAt: serverTimestamp()
            }
        );


        console.log(
            "Firebase Signup successful:",
            user.uid
        );


        showMessage(
            message,
            "Account created successfully! Redirecting...",
            "success"
        );


        // Firebase automatically signs the user
        // in after successful account creation.
        setTimeout(() => {

            window.location.href =
                "dashboard.html";

        }, 800);


    } catch (error) {

        console.error(
            "Signup error:",
            error
        );


        showMessage(
            message,
            getFirebaseErrorMessage(error),
            "error"
        );
    }
}


// ============================================================
// PASSWORD RESET
// ============================================================

async function resetPassword(event) {

    event.preventDefault();

    clearMessages();


    const email =
        document
            .getElementById("forgotEmail")
            .value
            .trim();

    const message =
        document.getElementById(
            "forgotMessage"
        );


    if (!email) {

        showMessage(
            message,
            "Please enter your email address.",
            "error"
        );

        return;
    }


    try {

        await sendPasswordResetEmail(
            auth,
            email
        );


        showMessage(
            message,
            "Password reset email sent. Check your inbox.",
            "success"
        );


    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );


        showMessage(
            message,
            getFirebaseErrorMessage(error),
            "error"
        );
    }
}


// ============================================================
// FIREBASE ERROR MESSAGES
// ============================================================

function getFirebaseErrorMessage(error) {

    switch (error.code) {

        case "auth/email-already-in-use":

            return "An account with this email already exists.";


        case "auth/invalid-email":

            return "Please enter a valid email address.";


        case "auth/weak-password":

            return "Your password is too weak. Use at least 8 characters.";


        case "auth/invalid-credential":

            return "Invalid email or password.";


        case "auth/user-not-found":

            return "No account was found with this email.";


        case "auth/wrong-password":

            return "Invalid email or password.";


        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";


        default:

            return "Something went wrong. Please try again.";
    }
}


// ============================================================
// MESSAGES
// ============================================================

function showMessage(element, text, type) {

    if (!element) return;

    element.textContent = text;

    element.className =
        "message " + type;

    setTimeout(
        updateContainerHeight,
        50
    );
}


function clearMessages() {

    document
        .querySelectorAll(".message")
        .forEach((message) => {

            message.textContent = "";

            message.className =
                "message";
        });


    setTimeout(
        updateContainerHeight,
        50
    );
}


// ============================================================
// IMPORTANT:
// Your HTML probably uses onclick="login(event)",
// onclick="signup(event)", etc.
//
// Because script.js is now a module, expose these
// functions to the HTML through window.
// ============================================================

window.login = login;

window.signup = signup;

window.resetPassword = resetPassword;

window.showScreen = showScreen;

window.togglePassword = togglePassword;


// ============================================================
// PAGE EVENTS
// ============================================================

window.addEventListener(
    "load",
    updateContainerHeight
);

window.addEventListener(
    "resize",
    updateContainerHeight
);