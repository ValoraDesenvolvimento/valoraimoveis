import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { By, Key, until, type WebDriver } from "selenium-webdriver";
import {
  createDriver,
  createPublishedPropertyViaApi,
  deletePropertyViaApi,
  go,
  loginAsAdmin,
  logout,
  openNewPropertyForm,
  pageSourceIncludes,
  waitReady,
} from "./helpers";
import { TEAM_IMOVIES, TEAM_LOGIN } from "@/lib/routes";

describe("Selenium — admin, rich text e anúncio", () => {
  let driver: WebDriver;
  const createdIds: string[] = [];

  beforeAll(async () => {
    driver = await createDriver();
  }, 60000);

  afterAll(async () => {
    try {
      await loginAsAdmin(driver);
      for (const id of createdIds) {
        await deletePropertyViaApi(driver, id);
      }
    } finally {
      if (driver) await driver.quit();
    }
  });

  it("login inválido mostra erro", async () => {
    await logout(driver);
    await go(driver, TEAM_LOGIN);
    const emailInput = await driver.wait(until.elementLocated(By.css("#email")), 20000);
    const passwordInput = await driver.findElement(By.css("#password"));
    await emailInput.clear();
    await emailInput.sendKeys("admin@valoraimoveis.com");
    await passwordInput.clear();
    await passwordInput.sendKeys("senha-errada-e2e");
    await driver.findElement(By.css('button[type="submit"]')).click();
    const alert = await driver.wait(until.elementLocated(By.css('[role="alert"]')), 15000);
    const alertText = await alert.getText();
    expect(alertText.toLowerCase()).toMatch(/inválid|tente novamente|não foi possível|muitas tentativas/);
  });

  it("login válido entra no painel de imóveis", async () => {
    await logout(driver);
    await loginAsAdmin(driver);
    expect(await driver.getCurrentUrl()).toContain(TEAM_IMOVIES);
    expect(await pageSourceIncludes(driver, "Imóveis")).toBe(true);
  });

  it("formulário tem editor rich text e campos extras", async () => {
    await loginAsAdmin(driver);
    await openNewPropertyForm(driver);

    expect(await pageSourceIncludes(driver, "Descrição")).toBe(true);
    expect(await pageSourceIncludes(driver, "Campos extras")).toBe(true);
    expect(await pageSourceIncludes(driver, "Banheiro social")).toBe(true);
    expect(await pageSourceIncludes(driver, "Exibir nos imóveis em destaque")).toBe(true);
    expect(await pageSourceIncludes(driver, "Exibir no carrousel principal")).toBe(true);

    const editor = await driver.findElement(By.css('[data-testid="rich-text-editor"]'));
    expect(await editor.isDisplayed()).toBe(true);

    const prose = await driver.findElement(By.css('[data-testid="rich-text-editor"] .ProseMirror'));
    await prose.click();
    await prose.sendKeys("Casa ampla com área gourmet.");
    await prose.sendKeys(Key.ENTER);
    await prose.sendKeys("Próxima ao centro.");

    const html = await driver.executeScript<string>(
      `return document.querySelector('[data-testid="rich-text-editor"] .ProseMirror')?.innerHTML || ""`,
    );
    expect(html.toLowerCase()).toContain("casa ampla");
  });

  it("tipo Terreno esconde banheiro social no formulário", async () => {
    await loginAsAdmin(driver);
    await openNewPropertyForm(driver);

    // Abre select de tipo (Radix) e escolhe Terreno
    const triggers = await driver.findElements(By.css("button[role='combobox']"));
    expect(triggers.length).toBeGreaterThan(0);
    await triggers[0].click();
    const terreno = await driver.wait(
      until.elementLocated(By.xpath("//*[normalize-space()='Terreno']")),
      10000,
    );
    await terreno.click();
    await driver.sleep(400);

    const source = await driver.getPageSource();
    // Label some fields hide; banheiro social should not appear as editable label for terreno
    // The form still has other content; check rooms section title changes or social bathrooms gone
    const socialVisible = await driver.executeScript<boolean>(`
      const labels = Array.from(document.querySelectorAll('label, p, span'));
      return labels.some((el) => el.textContent?.trim() === 'Banheiro social' && el.offsetParent !== null);
    `);
    expect(socialVisible).toBe(false);
    expect(source).toContain("Terreno");
  });

  it("cria imóvel com HTML e renderiza description no anúncio", async () => {
    await loginAsAdmin(driver);

    const stamp = Date.now();
    const created = await createPublishedPropertyViaApi(driver, {
      title: `E2E Rich Text ${stamp}`,
      ref: `E2E-${stamp}`,
      type: "Casa",
      typeLabel: "Casa",
      status: "Publicado",
      price: 750000,
      description:
        "<h2>Sobre este imóvel</h2><p>Casa <strong>reformada</strong> com jardim.</p><ul><li>Piscina</li><li>Churrasqueira</li></ul>",
      cep: "80010-000",
      address: "Rua Teste E2E",
      number: "100",
      complement: "",
      floors: 0,
      units: 0,
      towers: 0,
      addressDisplay: "street",
      neighborhood: "Centro",
      city: "Curitiba",
      state: "PR",
      latitude: "",
      longitude: "",
      bedrooms: 3,
      suites: 1,
      bathrooms: 2,
      socialBathrooms: 1,
      parking: 2,
      builtArea: 0,
      area: 150,
      landArea: 200,
      condo: "",
      condoExempt: true,
      iptu: "",
      iptuPeriod: "anual",
      iptuExempt: true,
      rooms: ["Sala"],
      leisure: ["Piscina"],
      extras: [],
      proximities: ["Mercado"],
      customFields: [{ label: "Ano", value: "2024" }],
      roomsCustomFields: [{ label: "Closet", value: "1" }],
      locationCustomFields: [{ label: "Portaria", value: "24h" }],
      images: [],
      image: "",
      featured: false,
      highlight: false,
    });
    createdIds.push(created.id);

    await go(driver, `/imoveis/${created.slug}`);
    await waitReady(driver);

    expect(await pageSourceIncludes(driver, "Sobre o imóvel")).toBe(true);
    const description = await driver.wait(
      until.elementLocated(By.css('[data-testid="property-description"]')),
      15000,
    );
    const text = await description.getText();
    expect(text).toContain("Sobre este imóvel");
    expect(text).toContain("reformada");
    expect(text).toContain("Piscina");

    const html = await description.getAttribute("innerHTML");
    expect(html).toContain("<strong>");
    expect(html).toContain("<ul>");

    const mainText = (await driver.findElement(By.css("main")).getText()).toLowerCase();
    expect(mainText).toContain("ano");
    expect(mainText).toContain("2024");
    expect(mainText).toContain("closet");
    expect(mainText).toContain("portaria");
    expect(mainText).toContain("24h");
    expect(mainText).toContain("banheiro social");
  });

  it("respeita privacidade de endereço (somente rua e bairro)", async () => {
    await loginAsAdmin(driver);
    const stamp = Date.now();
    const created = await createPublishedPropertyViaApi(driver, {
      title: `E2E Privacidade ${stamp}`,
      ref: `E2E-P-${stamp}`,
      type: "Apartamento",
      typeLabel: "Apartamento",
      status: "Publicado",
      price: 500000,
      description: "<p>Apartamento discreto.</p>",
      cep: "80020-000",
      address: "Rua Secreta",
      number: "777B",
      complement: "Apto 12",
      floors: 10,
      units: 40,
      towers: 1,
      addressDisplay: "street",
      neighborhood: "Batel",
      city: "Curitiba",
      state: "PR",
      latitude: "-25.4",
      longitude: "-49.2",
      bedrooms: 2,
      suites: 1,
      bathrooms: 1,
      socialBathrooms: 0,
      parking: 1,
      builtArea: 80,
      area: 80,
      landArea: 0,
      condo: "R$ 800",
      condoExempt: false,
      iptu: "",
      iptuPeriod: "anual",
      iptuExempt: true,
      rooms: [],
      leisure: [],
      extras: [],
      proximities: [],
      customFields: [],
      roomsCustomFields: [],
      locationCustomFields: [],
      images: [],
      image: "",
      featured: false,
      highlight: false,
    });
    createdIds.push(created.id);

    await go(driver, `/imoveis/${created.slug}`);
    await waitReady(driver);
    const mainText = await driver.findElement(By.css("main")).getText();
    expect(mainText).toContain("Rua Secreta");
    expect(mainText).toContain("Batel");
    expect(mainText).not.toContain("777B");
    expect(mainText).not.toContain("Apto 12");
    expect(mainText).not.toContain("80020-000");
  });
});
