<?php
session_start();

// Handle signup
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    if (empty($name) || empty($email) || empty($password)) {
        $error = 'All fields are required';
    } elseif ($password !== $confirm_password) {
        $error = 'Passwords do not match';
    } elseif (strlen($password) < 8) {
        $error = 'Password must be at least 8 characters';
    } else {
        // Mock registration - replace with real database insert
        $_SESSION['user_id'] = 1;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        
        header('Location: index.php');
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - IntervuAI Pro</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/premium.css">
    <link rel="stylesheet" href="assets/css/auth.css">
</head>
<body>
    <div class="premium-bg">
        <div class="gradient-mesh"></div>
        <div class="neural-network">
            <canvas id="neuralCanvas"></canvas>
        </div>
    </div>

    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <div class="brand-logo">
                    <div class="brand-icon">
                        <i class="fas fa-brain"></i>
                    </div>
                    <span class="brand-text">IntervuAI<span class="brand-pro">Pro</span></span>
                </div>
                <h1 class="auth-title">Create Account</h1>
                <p class="auth-subtitle">Start your AI-powered interview journey</p>
            </div>

            <?php if (isset($error)): ?>
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <span><?php echo htmlspecialchars($error); ?></span>
            </div>
            <?php endif; ?>

            <form method="POST" class="auth-form">
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-user"></i>
                        <span>Full Name</span>
                    </label>
                    <input 
                        type="text" 
                        name="name" 
                        class="form-input" 
                        placeholder="John Doe"
                        required
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-envelope"></i>
                        <span>Email Address</span>
                    </label>
                    <input 
                        type="email" 
                        name="email" 
                        class="form-input" 
                        placeholder="you@example.com"
                        required
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-lock"></i>
                        <span>Password</span>
                    </label>
                    <input 
                        type="password" 
                        name="password" 
                        class="form-input" 
                        placeholder="••••••••"
                        minlength="8"
                        required
                    >
                    <span class="form-hint">Minimum 8 characters</span>
                </div>

                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-lock"></i>
                        <span>Confirm Password</span>
                    </label>
                    <input 
                        type="password" 
                        name="confirm_password" 
                        class="form-input" 
                        placeholder="••••••••"
                        required
                    >
                </div>

                <label class="checkbox-label">
                    <input type="checkbox" required>
                    <span>I agree to the <a href="#" class="link-primary">Terms</a> and <a href="#" class="link-primary">Privacy Policy</a></span>
                </label>

                <button type="submit" class="btn-primary btn-block">
                    <span>Create Account</span>
                    <i class="fas fa-arrow-right"></i>
                    <div class="btn-glow"></div>
                </button>
            </form>

            <div class="auth-divider">
                <span>or sign up with</span>
            </div>

            <div class="social-login">
                <button class="btn-social">
                    <i class="fab fa-google"></i>
                </button>
                <button class="btn-social">
                    <i class="fab fa-github"></i>
                </button>
                <button class="btn-social">
                    <i class="fab fa-linkedin"></i>
                </button>
            </div>

            <div class="auth-footer">
                <p>Already have an account? <a href="login.php" class="link-primary">Sign in</a></p>
            </div>
        </div>

        <div class="auth-features">
            <div class="feature-item">
                <div class="feature-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h3>Get Started in Minutes</h3>
                <p>Quick setup, no credit card required</p>
            </div>
            <div class="feature-item">
                <div class="feature-icon">
                    <i class="fas fa-users"></i>
                </div>
                <h3>Join 10,000+ Users</h3>
                <p>Trusted by leading companies worldwide</p>
            </div>
            <div class="feature-item">
                <div class="feature-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h3>Premium Features</h3>
                <p>AI detection, analytics, and more</p>
            </div>
        </div>
    </div>

    <script src="assets/js/neural-bg.js"></script>
</body>
</html>
