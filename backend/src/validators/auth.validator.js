/**
 * Auth validator for login request body.
 */

const validateLogin = (body) => {
  const errors = [];

  if (!body.username || typeof body.username !== 'string' || body.username.trim().length === 0) {
    errors.push({ field: 'username', message: 'Username is required' });
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      username: body.username.trim(),
      password: body.password,
    },
  };
};

const validatePasswordChange = (body) => {
  const errors = [];

  const currentPassword = body.current_password;
  const newPassword = body.new_password;
  const confirmPassword = body.confirm_password;

  if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.length === 0) {
    errors.push({ field: 'current_password', message: 'Current password is required' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length === 0) {
    errors.push({ field: 'new_password', message: 'New password is required' });
  } else {
    if (newPassword.length < 10) {
      errors.push({ field: 'new_password', message: 'New password must be at least 10 characters' });
    }
    if (newPassword.length > 128) {
      errors.push({ field: 'new_password', message: 'New password cannot exceed 128 characters' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push({ field: 'new_password', message: 'New password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(newPassword)) {
      errors.push({ field: 'new_password', message: 'New password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(newPassword)) {
      errors.push({ field: 'new_password', message: 'New password must contain at least one number' });
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      errors.push({ field: 'new_password', message: 'New password must contain at least one special character' });
    }
    if (currentPassword && newPassword === currentPassword) {
      errors.push({ field: 'new_password', message: 'New password must be different from current password' });
    }
  }

  if (!confirmPassword || typeof confirmPassword !== 'string' || confirmPassword.length === 0) {
    errors.push({ field: 'confirm_password', message: 'Confirm password is required' });
  } else if (newPassword && newPassword !== confirmPassword) {
    errors.push({ field: 'confirm_password', message: 'Confirm password must match the new password' });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Do not trim passwords, spaces might be intentional
  return {
    valid: true,
    data: {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    },
  };
};

module.exports = {
  validateLogin,
  validatePasswordChange,
};
