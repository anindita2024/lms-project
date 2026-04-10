// 1. Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Check for saved user preference in LocalStorage
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.textContent = '☀️'; // Change icon to sun
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    let theme = 'light';
    if (body.classList.contains('dark-mode')) {
        theme = 'dark';
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }

    // Save the choice so it stays when the page reloads
    localStorage.setItem('theme', theme);
});

// 2. Simple Form Validation (Optional but helpful)
// This prevents the Admin from accidentally submitting an empty upload form
const uploadForm = document.querySelector('form[enctype="multipart/form-data"]');
if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
        const fileInput = uploadForm.querySelector('input[type="file"]');
        if (fileInput.files.length === 0) {
            e.preventDefault();
            alert("Please select a file to upload!");
        }
    });
}