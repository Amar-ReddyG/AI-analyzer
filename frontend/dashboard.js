/* =========================================
   FIREBASE IMPORTS
========================================= */

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut,
    updateProfile
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    updateDoc
} from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


/* =========================================
   FIREBASE CONFIG
========================================= */

/*
   IMPORTANT:
   Put the SAME Firebase web configuration
   that you used in script.js here.
*/

const firebaseConfig = {
  apiKey: "AIzaSyCphf3oxw8Fu4V9Ii8OwvHO69vjitSrp8M",
  authDomain: "careercopilot-9c227.firebaseapp.com",
  projectId: "careercopilot-9c227",
  storageBucket: "careercopilot-9c227.firebasestorage.app",
  messagingSenderId: "137943103617",
  appId: "1:137943103617:web:cd34c6eda65f0e91b2f580",
  measurementId: "G-R8KYLFX41M"
};


/* =========================================
   INITIALIZE FIREBASE
========================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================
   GET CURRENT USER
========================================= */

let currentUser = null;


onAuthStateChanged(auth, async (user) => {

    if (!user) {

        // User is not logged in
        window.location.href = "index.html";

        return;
    }


    currentUser = user;

    console.log("Dashboard user:", user.uid);

    await loadUserProfile(user);

});


/* =========================================
   LOAD USER PROFILE
========================================= */

async function loadUserProfile(user) {

    let name = user.displayName;

    let email = user.email || "";


    /*
       If displayName is not available from
       Firebase Authentication, try Firestore.
    */

    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const userSnapshot = await getDoc(userRef);


        if (userSnapshot.exists()) {

            const userData = userSnapshot.data();

            if (!name) {
                name = userData.fullName || "";
            }

            if (!email) {
                email = userData.email || "";
            }
        }

    } catch (error) {

        console.error(
            "Could not load Firestore profile:",
            error
        );
    }


    /*
       Fallback name
    */

    if (!name) {

        if (email) {
            name = email.split("@")[0];
        } else {
            name = "User";
        }
    }


    updateUserInterface(name, email);
}


/* =========================================
   UPDATE USER INTERFACE
========================================= */

function updateUserInterface(name, email) {

    const firstName =
        name.trim().split(" ")[0] || "there";


    // Welcome message

    const welcomeName =
        document.getElementById("welcomeName");

    if (welcomeName) {
        welcomeName.textContent = firstName;
    }


    // Sidebar

    const sidebarName =
        document.getElementById("sidebarUserName");

    const sidebarEmail =
        document.getElementById("sidebarUserEmail");


    if (sidebarName) {
        sidebarName.textContent = name;
    }

    if (sidebarEmail) {
        sidebarEmail.textContent = email;
    }


    // Top profile

    const topName =
        document.getElementById("topUserName");

    if (topName) {
        topName.textContent = firstName;
    }


    // Profile section

    const profileName =
        document.getElementById("profileName");

    const profileEmail =
        document.getElementById("profileEmail");


    if (profileName) {
        profileName.textContent = name;
    }

    if (profileEmail) {
        profileEmail.textContent = email;
    }


    // Profile inputs

    const profileNameInput =
        document.getElementById("profileFullName");

    const profileEmailInput =
        document.getElementById("profileEmailInput");


    if (profileNameInput) {
        profileNameInput.value = name;
    }

    if (profileEmailInput) {
        profileEmailInput.value = email;
    }


    // Avatar initials

    const initials =
        getInitials(name);


    const avatars = [
        "sidebarAvatar",
        "topAvatar",
        "profileAvatar"
    ];


    avatars.forEach((id) => {

        const avatar =
            document.getElementById(id);

        if (avatar) {
            avatar.textContent = initials;
        }

    });
}


/* =========================================
   GET INITIALS
========================================= */

function getInitials(name) {

    if (!name) {
        return "U";
    }


    const words =
        name.trim().split(/\s+/);


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


/* =========================================
   SECTION NAVIGATION
========================================= */

function showSection(sectionId, clickedButton = null) {

    const sections =
        document.querySelectorAll(".dashboard-section");


    sections.forEach((section) => {

        section.classList.remove(
            "active-section"
        );

    });


    const target =
        document.getElementById(sectionId);


    if (!target) {
        console.error(
            "Section not found:",
            sectionId
        );

        return;
    }


    target.classList.add(
        "active-section"
    );


    /*
       Update sidebar active item
    */

    const navItems =
        document.querySelectorAll(".nav-item");


    navItems.forEach((item) => {

        item.classList.remove("active");

    });


    if (clickedButton) {

        clickedButton.classList.add("active");

    } else {

        /*
           Find nav button associated with
           the section.
        */

        navItems.forEach((item) => {

            const onclick =
                item.getAttribute("onclick");

            if (
                onclick &&
                onclick.includes(
                    `'${sectionId}'`
                )
            ) {

                item.classList.add("active");

            }

        });

    }


    /*
       Close mobile sidebar
    */

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (sidebar) {
        sidebar.classList.remove(
            "mobile-open"
        );
    }

    if (overlay) {
        overlay.classList.remove(
            "active"
        );
    }


    /*
       Scroll to top
    */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================
   MOBILE SIDEBAR
========================================= */

function toggleSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (!sidebar || !overlay) {
        return;
    }


    sidebar.classList.toggle(
        "mobile-open"
    );

    overlay.classList.toggle(
        "active"
    );
}


/* =========================================
   LOGOUT
========================================= */

async function logout() {

    try {

        await signOut(auth);

        console.log(
            "User logged out successfully."
        );

        window.location.href =
            "index.html";

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Unable to log out. Please try again."
        );
    }
}


/* =========================================
   SAVE PROFILE
========================================= */

async function saveProfile() {

    if (!currentUser) {

        alert(
            "You are not logged in."
        );

        return;
    }


    const nameInput =
        document.getElementById(
            "profileFullName"
        );


    if (!nameInput) {
        return;
    }


    const newName =
        nameInput.value.trim();


    if (!newName) {

        alert(
            "Please enter your full name."
        );

        return;
    }


    try {

        /*
           Update Firebase Authentication
        */

        await updateProfile(
            currentUser,
            {
                displayName: newName
            }
        );


        /*
           Update Firestore
        */

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );


        await updateDoc(
            userRef,
            {
                fullName: newName
            }
        );


        /*
           Refresh UI
        */

        updateUserInterface(
            newName,
            currentUser.email || ""
        );


        alert(
            "Profile updated successfully."
        );


    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );


        alert(
            "Could not update your profile: " +
            error.message
        );
    }
}


/* =========================================
   CONNECT SAVE PROFILE BUTTON
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const profileSection =
            document.getElementById(
                "profile"
            );


        if (!profileSection) {
            return;
        }


        const buttons =
            profileSection.querySelectorAll(
                ".primary-button"
            );


        buttons.forEach((button) => {

            button.addEventListener(
                "click",
                saveProfile
            );

        });

    }
);


/* =========================================
   EXPOSE FUNCTIONS TO HTML
========================================= */

window.showSection =
    showSection;

window.toggleSidebar =
    toggleSidebar;

window.logout =
    logout;

window.saveProfile =
    saveProfile;