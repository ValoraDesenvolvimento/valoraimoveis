import { Builder, By, until, type WebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { getAdminCredentials } from "@/lib/admin-credentials";
import { TEAM_IMOVEL_FORM, TEAM_IMOVIES, TEAM_LOGIN } from "@/lib/routes";

export const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

export async function createDriver(): Promise<WebDriver> {
  const options = new chrome.Options();
  options.addArguments(
    "--headless=new",
    "--window-size=1400,1000",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
  );

  const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
  await driver.manage().window().setRect({ width: 1400, height: 1000, x: 0, y: 0 });
  return driver;
}

export function url(path: string) {
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function waitReady(driver: WebDriver) {
  await driver.wait(async () => {
    const state = await driver.executeScript<string>("return document.readyState");
    return state === "complete";
  }, 20000);
}

export async function go(driver: WebDriver, path: string) {
  await driver.get(url(path));
  await waitReady(driver);
}

export async function pageSourceIncludes(driver: WebDriver, text: string) {
  const source = await driver.getPageSource();
  return source.includes(text);
}

export async function logout(driver: WebDriver) {
  await driver.executeAsyncScript(`
    const done = arguments[arguments.length - 1];
    fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
      .then(() => done(true))
      .catch(() => done(false));
  `);
  await driver.manage().deleteAllCookies();
}

export async function loginAsAdmin(driver: WebDriver) {
  const { email, password } = getAdminCredentials();

  await go(driver, TEAM_IMOVIES);
  let current = await driver.getCurrentUrl();
  if (current.includes(TEAM_IMOVIES) && !current.includes("login")) {
    return;
  }

  await go(driver, TEAM_LOGIN);
  current = await driver.getCurrentUrl();
  if (current.includes(TEAM_IMOVIES) && !current.includes("login")) {
    return;
  }

  const emailInput = await driver.wait(until.elementLocated(By.css("#email")), 20000);
  const passwordInput = await driver.findElement(By.css("#password"));
  await emailInput.clear();
  await emailInput.sendKeys(email);
  await passwordInput.clear();
  await passwordInput.sendKeys(password);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await driver.wait(until.urlContains(TEAM_IMOVIES), 20000);
  await waitReady(driver);
}

export async function openNewPropertyForm(driver: WebDriver) {
  await go(driver, TEAM_IMOVEL_FORM);
  await driver.wait(until.elementLocated(By.css('[data-testid="rich-text-editor"]')), 20000);
}

export async function createPublishedPropertyViaApi(
  driver: WebDriver,
  payload: Record<string, unknown>,
) {
  const result = await driver.executeAsyncScript<string>(
    `
    const payload = arguments[0];
    const done = arguments[arguments.length - 1];
    fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Falha ao criar");
        done(JSON.stringify(data));
      })
      .catch((error) => done(JSON.stringify({ error: String(error) })));
    `,
    payload,
  );

  const parsed = JSON.parse(result) as { slug?: string; error?: string; id?: string };
  if (parsed.error || !parsed.slug) {
    throw new Error(parsed.error || "Imóvel sem slug");
  }
  return parsed as { id: string; slug: string };
}

export async function deletePropertyViaApi(driver: WebDriver, id: string) {
  await driver.executeAsyncScript(
    `
    const id = arguments[0];
    const done = arguments[arguments.length - 1];
    fetch("/api/properties/" + id, {
      method: "DELETE",
      credentials: "same-origin",
    })
      .then(() => done(true))
      .catch(() => done(false));
    `,
    id,
  );
}
