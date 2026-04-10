// This function checks if the user is logged in
export const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next(); // User is logged in, proceed to the page
    }
    res.redirect('/login'); // Not logged in, send them to login
};

// This function checks if the user is specifically an ADMIN
export const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next(); // User is an admin, let them upload
    }
    // If not an admin, send an error or redirect
    res.status(403).send("Access Denied: Only the Admin can upload lectures and notes.");
};