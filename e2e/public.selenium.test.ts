import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { By, until, type WebDriver } from "selenium-webdriver";
import {
  createDriver,
  go,
  pageSourceIncludes,
  waitReady,
} from "./helpers";

describe("Selenium — páginas públicas", () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await createDriver();
  }, 60000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  it("home carrega com marca e navegação", async () => {
    await go(driver, "/");
    const title = await driver.getTitle();
    expect(title.toLowerCase()).toContain("valora");
    expect(await pageSourceIncludes(driver, "Imóveis")).toBe(true);
    expect(await pageSourceIncludes(driver, "Contato")).toBe(true);
  });

  it("catálogo /imoveis responde", async () => {
    await go(driver, "/imoveis");
    await driver.wait(until.elementLocated(By.css("body")), 10000);
    expect(await pageSourceIncludes(driver, "Imóveis")).toBe(true);
  });

  it("página sobre responde", async () => {
    await go(driver, "/sobre");
    expect(await pageSourceIncludes(driver, "Sobre")).toBe(true);
  });

  it("página contato responde", async () => {
    await go(driver, "/contato");
    expect(await pageSourceIncludes(driver, "Contato")).toBe(true);
  });

  it("navegação home → imóveis → contato", async () => {
    await go(driver, "/");
    const imoveisLinks = await driver.findElements(By.css('a[href="/imoveis"]'));
    const visibleImoveis = [];
    for (const link of imoveisLinks) {
      if (await link.isDisplayed()) visibleImoveis.push(link);
    }
    expect(visibleImoveis.length).toBeGreaterThan(0);
    await visibleImoveis[0].click();
    await driver.wait(until.urlContains("/imoveis"), 15000);
    await waitReady(driver);
    expect(await driver.getCurrentUrl()).toContain("/imoveis");

    // Footer link is always in DOM; scroll and click for reliable navigation
    await driver.executeScript(
      `document.querySelector('footer a[href="/contato"]')?.scrollIntoView({block:"center"})`,
    );
    const contato = await driver.wait(
      until.elementLocated(By.css('footer a[href="/contato"]')),
      10000,
    );
    await contato.click();
    await driver.wait(until.urlContains("/contato"), 15000);
    await waitReady(driver);
    expect(await driver.getCurrentUrl()).toContain("/contato");
  });
});
