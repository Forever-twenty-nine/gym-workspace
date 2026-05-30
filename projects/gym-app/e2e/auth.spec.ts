import { test, expect } from '@playwright/test';

test.describe('Flujo completo de registro, logout y login', () => {

  const testEmail = `entrenado_${Date.now()}@test.com`;
  const testPassword = 'Password123!';

  test('debería poder registrarse como entrenado, cerrar sesión y volver a entrar', async ({ page }) => {
    
    // 1. Ir a Registro desde la página principal
    await page.goto('/welcome');
    
    // Hacer click en el botón de registrarse
    await page.locator('ion-button', { hasText: 'Regístrate' }).click();
    await page.waitForURL(/.*register/, { timeout: 15000 });
    // Los inputs de Ionic a veces encapsulan el input real
    await page.locator('ion-input[formControlName="email"] input').fill(testEmail);
    await page.locator('ion-input[formControlName="password"] input').fill(testPassword);
    
    // Confirmar contraseña (el nombre puede variar, usar selector general)
    await page.locator('ion-input[type="password"]').nth(1).locator('input').fill(testPassword);

    // Click en Registrarse
    await page.locator('ion-button', { hasText: 'Crear cuenta' }).click();

    // 2. Esperar a que navegue al onboarding
    await page.waitForURL(/.*onboarding/, { timeout: 10000 });
    
    // Llenar onboarding (Paso 1: Datos Personales)
    const nombreInput = page.locator('ion-item', { hasText: /Nombre Completo/i }).locator('ion-input input');
    await nombreInput.fill('Juan Entrenado');
    await nombreInput.blur();
    
    await page.locator('ion-select').click();
    
    // Ionic renderiza un overlay (alert) con radio buttons para las opciones
    await page.getByRole('radio', { name: 'Entrenado', exact: true }).click();
    
    // En Ionic el alert/popover necesita confirmación
    const okBtn = page.locator('button', { hasText: 'OK' });
    await okBtn.waitFor({ state: 'visible' });
    await okBtn.click();
    
    // Continuar (siguiente paso)
    await page.locator('ion-button', { hasText: 'Continuar' }).click();

    // Asegurarnos de que no hay error de validación
    await expect(page.locator('ion-text[color="danger"]')).not.toBeVisible();

    // Llenar onboarding (Paso 2: Objetivo - para entrenados)
    await page.locator('ion-select').click();
    
    // Buscar la opción Salud en el alert
    await page.getByRole('radio', { name: /salud/i }).click();
    await okBtn.waitFor({ state: 'visible' });
    await okBtn.click();

    await page.locator('ion-button', { hasText: 'Finalizar' }).click();

    // 3. Esperar a que navegue a las tabs de entrenado
    await page.waitForURL(/.*entrenado-tabs/, { timeout: 10000 });

    // 4. Cerrar sesión
    // Abrir el menú lateral del perfil
    await page.locator('ion-menu-button').click();
    
    // Buscar el botón de logout dentro del menú lateral
    const logoutBtn = page.locator('ion-menu[menuId="profile-menu"] ion-button', { hasText: /cerrar sesi/i });
    // Usamos evaluate para forzar el clic nativo de JS sin importar si la animación de ion-menu ya terminó
    await logoutBtn.evaluate((el: HTMLElement) => el.click());

    // Verificar que volvió a login/welcome
    await page.waitForURL(/.*(login|welcome)/);

    // 5. Volver a Iniciar Sesión
    await page.goto('/login');
    await page.locator('ion-input[name="email"] input').fill(testEmail);
    await page.locator('ion-input[name="password"] input').fill(testPassword);
    
    await page.locator('ion-button', { hasText: 'Iniciar Sesión' }).click();

    // Debería redirigir directamente a entrenado-tabs sin pasar por onboarding
    await page.waitForURL(/.*entrenado-tabs/, { timeout: 10000 });
  });

});
