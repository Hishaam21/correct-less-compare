export function validatePassword(password) {
  const errors = []

  if (!password) {
    return { valid: false, errors: ['Password is required'] }
  }

  if (password.length < 8) {
    errors.push('At least 8 characters')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('At least 1 uppercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('At least 1 number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('At least 1 special character (!@#$%^&*)')
  }

  return {
    valid: errors.length === 0,
    errors,
    strength: getPasswordStrength(password)
  }
}

function getPasswordStrength(password) {
  let strength = 0

  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++

  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
}

export function getStrengthColor(strength) {
  switch (strength) {
    case 'weak':
      return '#d32f2f'
    case 'medium':
      return '#ff9800'
    case 'strong':
      return '#2f9e44'
    default:
      return '#e6e6e6'
  }
}
