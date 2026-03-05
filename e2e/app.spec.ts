import { test, expect } from '@playwright/test';

test.describe('Protocol App E2E', () => {
    // Use a unique email per test run to avoid conflicts
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'password123';

    test('Registration, Login, and Settings Flow', async ({ page }) => {
        // 1. Navigate to Login Page
        await page.goto('/login');

        // 2. Switch to Registration
        await page.click('text=Sign up');

        // 3. Fill Registration Form
        await page.fill('input[type="text"]', 'Test User');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);

        // 4. Submit Registration (will auto-login and redirect to dashboard)
        await page.click('button[type="submit"]');

        // 5. Verify Dashboard load
        await expect(page).toHaveURL(/\/?$/); // matches / or empty
        await expect(page.locator('text=Secure, local transcription.')).toBeVisible();

        // 6. Navigate to Settings
        await page.click('text=Settings');
        await expect(page).toHaveURL(/\/settings$/);

        // 7. Verify Default Settings exist and Update them
        await expect(page.locator('input[type="url"]')).toBeVisible();
        await page.fill('input[type="url"]', 'http://localhost:11434/v1/chat/completions'); // E.g., Ollama test
        await page.fill('input[type="password"]', 'dummy-key');
        await page.click('button[type="submit"]');

        // 8. Verify Save Success
        await expect(page.locator('text=Settings saved successfully.')).toBeVisible();

        // 9. Navigate to History
        await page.click('text=History');
        await expect(page).toHaveURL(/\/history$/);

        // 10. Verify Empty History State for new user
        await expect(page.locator('text=No transcripts saved yet.')).toBeVisible();
    });
});
