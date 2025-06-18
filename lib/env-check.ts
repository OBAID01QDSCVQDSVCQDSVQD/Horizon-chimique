// Environment variables checker for NextAuth
export function checkAuthEnvVars() {
  const requiredVars = [
    'AUTH_SECRET',
    'NEXTAUTH_SECRET',
    'AUTH_GOOGLE_ID', 
    'GOOGLE_CLIENT_ID',
    'AUTH_GOOGLE_SECRET',
    'GOOGLE_CLIENT_SECRET'
  ];

  const envStatus = requiredVars.map(varName => ({
    name: varName,
    value: process.env[varName] ? '✅ Set' : '❌ Missing',
    length: process.env[varName]?.length || 0
  }));

  console.log('🔍 Environment Variables Status:');
  envStatus.forEach(({ name, value, length }) => {
    console.log(`  ${name}: ${value}${length > 0 ? ` (${length} chars)` : ''}`);
  });

  // Return the first available secret
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  return {
    secret,
    googleId,
    googleSecret,
    hasAllRequired: !!(secret && googleId && googleSecret)
  };
} 