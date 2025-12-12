<?php
session_start();

// Handle login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    // Simple validation (in production, use proper authentication)
    if (!empty($email) && !empty($password)) {
        // Mock authentication - replace with real database check
        $_SESSION['user_id'] = 1;
        $_SESSION['user_name'] = explode('@', $email)[0];
        $_SESSION['user_email'] = $email;
        
        header('Location: index.php');
        exit;
    } else {
        $error = 'Please enter both email and password';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - IntervuAI Pro</title>
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
                <h1 class="auth-title">Welcome Back</h1>
                <p class="auth-subtitle">Sign in to continue to your dashboard</p>
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
                        required
                    >
                </div>

                <div class="form-options">
                    <label class="checkbox-label">
                        <input type="checkbox" name="remember">
                        <span>Remember me</span>
                    </label>
                    <a href="#" class="link-primary">Forgot password?</a>
                </div>

                <button type="submit" class="btn-primary btn-block">
                    <span>Sign In</span>
                    <i class="fas fa-arrow-right"></i>
                    <div class="btn-glow"></div>
                </button>
            </form>

            <div class="auth-divider">
                <span>or continue with</span>
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
                <p>Don't have an account? <a href="signup.php" class="link-primary">Sign up</a></p>
            </div>
        </div>

        <div class="auth-features">
            <div class="feature-item">
                <div class="feature-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3>Enterprise Security</h3>
                <p>Bank-level encryption and data protection</p>
            </div>
            <div class="feature-item">
                <div class="feature-icon">
                    <i class="fas fa-bolt"></i>
                </div>
                <h3>Lightning Fast</h3>
                <p>AI-powered analysis in seconds</p>
            </div>
            <div class="feature-item">
                <div class="feature-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h3>Advanced Analytics</h3>
                <p>Comprehensive insights and reports</p>
            </div>
        </div>
    </div>

    <script src="assets/js/neural-bg.js"></script>
</body>
</html>
