<?php
session_start();

// Handle signup
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    
    if ($password !== $confirmPassword) {
        $error = 'Passwords do not match';
    } elseif ($name && $email && $password) {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        header('Location: index.php');
        exit;
    } else {
        $error = 'Please fill in all fields';
    }
}

// Redirect if already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - IntervuAI Pro</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg-primary: #1a1a1a;
            --bg-secondary: #282828;
            --bg-tertiary: #2d2d2d;
            --bg-hover: #3d3d3d;
            --border-color: #3d3d3d;
            --text-primary: #eff1f6;
            --text-secondary: #9ca3af;
            --text-muted: #6b7280;
            --accent-primary: #ffa116;
            --accent-green: #00b8a3;
            --accent-red: #ef4444;
            --radius-md: 6px;
            --radius-lg: 8px;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg-primary); color: var(--text-primary); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .auth-container { display: flex; gap: 60px; max-width: 1000px; width: 100%; align-items: center; }
        .auth-card { flex: 1; max-width: 420px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 40px; }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
        .brand-icon { width: 44px; height: 44px; background: var(--accent-primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #000; }
        .brand-text { font-size: 22px; font-weight: 700; }
        .brand-text .pro { color: var(--accent-primary); }
        .auth-title { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .auth-subtitle { color: var(--text-secondary); font-size: 14px; margin-bottom: 32px; }
        .alert { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md); color: var(--accent-red); font-size: 13px; margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px; }
        .form-input { width: 100%; padding: 12px 16px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-primary); font-size: 14px; transition: border-color 0.2s; }
        .form-input:focus { outline: none; border-color: var(--accent-primary); }
        .form-input::placeholder { color: var(--text-muted); }
        .link { color: var(--accent-primary); text-decoration: none; font-weight: 500; }
        .link:hover { text-decoration: underline; }
        .btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 24px; background: var(--accent-primary); border: none; border-radius: var(--radius-md); color: #000; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 8px; }
        .btn:hover { background: #ffb340; }
        .divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; color: var(--text-muted); font-size: 13px; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border-color); }
        .social-btns { display: flex; gap: 12px; margin-bottom: 24px; }
        .social-btn { flex: 1; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-primary); font-size: 18px; cursor: pointer; transition: all 0.2s; }
        .social-btn:hover { background: var(--bg-hover); border-color: var(--accent-primary); }
        .auth-footer { text-align: center; padding-top: 20px; border-top: 1px solid var(--border-color); color: var(--text-secondary); font-size: 14px; }
        .features { flex: 1; display: flex; flex-direction: column; gap: 32px; }
        .feature { display: flex; gap: 16px; }
        .feature-icon { width: 48px; height: 48px; background: linear-gradient(135deg, var(--accent-primary), var(--accent-green)); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #000; flex-shrink: 0; }
        .feature h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
        .feature p { color: var(--text-secondary); font-size: 13px; }
        @media (max-width: 900px) { .auth-container { flex-direction: column; gap: 40px; } .features { flex-direction: row; flex-wrap: wrap; justify-content: center; } .feature { flex: 1; min-width: 200px; max-width: 280px; } }
        @media (max-width: 500px) { .auth-card { padding: 24px; } .auth-title { font-size: 24px; } .features { display: none; } }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="brand">
                <div class="brand-icon"><i class="fas fa-brain"></i></div>
                <span class="brand-text">IntervuAI<span class="pro">Pro</span></span>
            </div>
            <h1 class="auth-title">Create Account</h1>
            <p class="auth-subtitle">Start your AI-powered interview journey</p>
            
            <?php if (isset($error)): ?>
            <div class="alert"><i class="fas fa-exclamation-circle"></i><span><?php echo htmlspecialchars($error); ?></span></div>
            <?php endif; ?>
            
            <form method="POST">
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-user"></i> Full Name</label>
                    <input type="text" name="name" class="form-input" placeholder="John Doe" required>
                </div>
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-envelope"></i> Email Address</label>
                    <input type="email" name="email" class="form-input" placeholder="you@example.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-lock"></i> Password</label>
                    <input type="password" name="password" class="form-input" placeholder="••••••••" required>
                </div>
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-lock"></i> Confirm Password</label>
                    <input type="password" name="confirm_password" class="form-input" placeholder="••••••••" required>
                </div>
                <button type="submit" class="btn">Create Account <i class="fas fa-arrow-right"></i></button>
            </form>
            <div class="divider">or continue with</div>
            <div class="social-btns">
                <button class="social-btn" type="button"><i class="fab fa-google"></i></button>
                <button class="social-btn" type="button"><i class="fab fa-github"></i></button>
                <button class="social-btn" type="button"><i class="fab fa-linkedin"></i></button>
            </div>
            <div class="auth-footer">Already have an account? <a href="login.php" class="link">Sign in</a></div>
        </div>
        <div class="features">
            <div class="feature">
                <div class="feature-icon"><i class="fas fa-shield-alt"></i></div>
                <div><h3>Enterprise Security</h3><p>Bank-level encryption and data protection</p></div>
            </div>
            <div class="feature">
                <div class="feature-icon"><i class="fas fa-bolt"></i></div>
                <div><h3>Lightning Fast</h3><p>AI-powered analysis in seconds</p></div>
            </div>
            <div class="feature">
                <div class="feature-icon"><i class="fas fa-chart-line"></i></div>
                <div><h3>Advanced Analytics</h3><p>Comprehensive insights and reports</p></div>
            </div>
        </div>
    </div>
</body>
</html>
