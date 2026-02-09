import { test, expect } from '@playwright/test';

const modes = ['normal', 'quiz', 'perfect'];

test.describe('Layout Overlap Check', () => {
  for (const mode of modes) {
    test.describe(`${mode} mode`, () => {
      test('Desktop (1280x720) - Camera should be to the right of main content', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/layout-check');

        const main = page.getByTestId(`${mode}-main`);
        const camera = page.getByTestId(`${mode}-camera`);

        await expect(main).toBeVisible();
        await expect(camera).toBeVisible();

        const mainBox = await main.boundingBox();
        const camBox = await camera.boundingBox();

        expect(mainBox).not.toBeNull();
        expect(camBox).not.toBeNull();

        if (mainBox && camBox) {
          const mainRight = mainBox.x + mainBox.width;
          // Assert cam.x > main.right - 10
          expect(camBox.x).toBeGreaterThan(mainRight - 10);
        }
      });

      test('Mobile (375x667) - Camera should be below main content', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/layout-check');

        const main = page.getByTestId(`${mode}-main`);
        const camera = page.getByTestId(`${mode}-camera`);

        await expect(main).toBeVisible();
        await expect(camera).toBeVisible();

        const mainBox = await main.boundingBox();
        const camBox = await camera.boundingBox();

        expect(mainBox).not.toBeNull();
        expect(camBox).not.toBeNull();

        if (mainBox && camBox) {
          const mainBottom = mainBox.y + mainBox.height;
          // Assert cam.y > main.bottom - 10
          expect(camBox.y).toBeGreaterThan(mainBottom - 10);
        }
      });
    });
  }
});
