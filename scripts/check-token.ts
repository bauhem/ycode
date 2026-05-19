import { validateToken } from '../lib/repositories/mcpTokenRepository';

async function main() {
  const token = 'ymc_52a82598e8378c031abad8000c08638a92f62115e464ba49';
  console.log('Validating token:', token);
  try {
    const result = await validateToken(token);
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
