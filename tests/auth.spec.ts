import { expect, test } from "@playwright/test";

test("login is available without offering public registration", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(
    page.getByRole("textbox", { name: "Nome de utilizador" })
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Palavra-passe" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /registar|criar conta/i })
  ).toHaveCount(0);
});

test("unauthenticated visitors are redirected from the gift list", async ({
  page,
}) => {
  await page.goto("/prendas");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fprendas$/);
});

test("unauthenticated visitors are redirected from their private offers", async ({
  page,
}) => {
  await page.goto("/ofertas");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fofertas$/);
});

test("unauthenticated visitors are redirected from gift creation", async ({
  page,
}) => {
  await page.goto("/prendas/nova");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fprendas%2Fnova$/);
});

test("offer creation preserves the selected list through login", async ({
  page,
}) => {
  await page.goto("/prendas/nova?kind=offer");
  await expect(page).toHaveURL(
    /\/login\?returnTo=%2Fprendas%2Fnova%3Fkind%3Doffer$/
  );
});

test("unauthenticated visitors are redirected from gift editing", async ({
  page,
}) => {
  await page.goto("/prendas/00000000-0000-4000-8000-000000000000/editar");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fprendas$/);
});

test("the public sign-up endpoint rejects account creation", async ({
  request,
}) => {
  const response = await request.post("/api/auth/sign-up/email", {
    data: {
      name: "Utilizador de teste",
      email: "signup-disabled@example.invalid",
      password: "temporary-password-123",
    },
  });

  expect(response.status()).toBe(400);
});
