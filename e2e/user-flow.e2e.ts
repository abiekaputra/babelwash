import { expect, test } from '@playwright/test';

test('staff and customer complete the local laundry journey', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Every load has a clear next step.' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'docs/images/login.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Open workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Today at BabelWash' })).toBeVisible();

  await page.getByRole('button', { name: /New order/ }).click();
  await page.getByLabel('Customer name').fill('Maya Rahma');
  await page.getByLabel('WhatsApp / phone').fill('081355501234');
  await page.getByLabel('Service').selectOption('wash-iron');
  await page.getByLabel(/Quantity/).fill('5.2');
  await page.getByLabel(/Care notes/).fill('Separate the white garments');
  await page.screenshot({
    path: 'docs/images/order-intake.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Create order' }).click();
  const success = page.getByText(/Order BW-.* created successfully/);
  await expect(success).toBeVisible();
  const code = (await success.textContent())?.match(/BW-[A-Z0-9-]+/)?.[0];
  expect(code).toBeTruthy();

  await page.getByRole('button', { name: /Wash queue/ }).click();
  const order = page.getByRole('article').filter({ hasText: code! });
  await expect(order).toBeVisible();
  await order.getByRole('button', { name: 'Move to washing' }).click();
  await order.getByRole('button', { name: 'Move to drying' }).click();
  await order.getByRole('button', { name: 'Move to ready' }).click();
  await order.getByRole('button', { name: 'Record payment' }).click();
  await expect(page.getByRole('dialog', { name: 'Record payment' })).toBeVisible();
  await page.screenshot({
    path: 'docs/images/payment.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Confirm payment' }).click();
  await expect(order.getByText('Rp 0')).toBeVisible();
  await page.screenshot({
    path: 'docs/images/ready-queue.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: true,
  });
  await order.getByRole('button', { name: 'Move to collected' }).click();
  await expect(order).toBeHidden();

  await page.getByRole('button', { name: /Overview/ }).click();
  await expect(page.getByRole('status')).toBeHidden({ timeout: 5_000 });
  await page.screenshot({
    path: 'docs/images/dashboard.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Customer tracking ↗' }).click();
  await page.getByPlaceholder('BW-261022-AB12').fill(code!);
  await page.getByRole('button', { name: 'Track order' }).click();
  await expect(page.getByText('Current status')).toBeVisible();
  await page.screenshot({
    path: 'docs/images/customer-tracking.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Staff sign in' }).click();
  await page.getByRole('button', { name: /Inventory/ }).click();
  await page.screenshot({
    path: 'docs/images/inventory.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: true,
  });

  await page.getByRole('button', { name: /Overview/ }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Today at BabelWash' })).toBeVisible();
  await page.screenshot({
    path: 'docs/images/mobile-dashboard.jpg',
    type: 'jpeg',
    quality: 90,
    fullPage: true,
  });
});
