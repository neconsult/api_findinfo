const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/consulta-anvisa', async (req, res) => {
    // Recebe o número do processo via query string (padrão de cosméticos)
    const processo = req.query.processo || "25351616621201201";

    let browser;
    try {
        const PROXY_HOST = "134.195.210.155";
        const PROXY_PORT = "3128";

        browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0');

        // 1. Abre a rota visual correta de cosméticos na SPA da Anvisa
        const urlVisual = `https://consultas.anvisa.gov.br/#/cosmeticos/regularizados/${processo}/?numeroProcesso=${processo}`;
        await page.goto(urlVisual, { waitUntil: 'networkidle2', timeout: 30000 });
        
        await new Promise(r => setTimeout(r, 4000));

        // 2. Executa o fetch direcionado exatamente para o endpoint de cosméticos da imagem
        const urlApi = `https://consultas.anvisa.gov.br/api/consulta/cosmeticos/regularizados/${processo}`;
        
        const resultadoJson = await page.evaluate(async (targetUrl) => {
            const response = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Authorization': 'Guest',
                    'Referer': 'https://consultas.anvisa.gov.br/'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }, urlApi);

        await browser.close();
        
        // Retorna o JSON limpo da consulta de cosméticos
        return res.json(resultadoJson);

    } catch (error) {
        if (browser) await browser.close();
        return res.status(500).json({ erro: error.message });
    }
});

app.get('/teste', async (req, res) => {
    // Recebe o número do processo via query string (padrão de cosméticos)
    const processo = req.query.processo || "25351616621201201";

    let browser;
    try {
        const PROXY_HOST = "134.195.210.155";
        const PROXY_PORT = "3128";

        browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0');

        // 1. Abre a rota visual correta de cosméticos na SPA da Anvisa
        const urlVisual = `https://consultas.anvisa.gov.br/#/saneantes/produtos/q/?cnpj=00536772000142`;
        await page.goto(urlVisual, { waitUntil: 'networkidle2', timeout: 30000 });
        
        await new Promise(r => setTimeout(r, 4000));

        // 2. Executa o fetch direcionado exatamente para o endpoint de cosméticos da imagem
        //const urlApi = `https://consultas.anvisa.gov.br/api/consulta/saneantes/produtos?column=&count=10&filter%5Bcnpj%5D=00536772000142&order=asc&page=1`;
        const urlApi = ` https://consultas.anvisa.gov.br/api/consulta/saneantes/notificados?count=10&filter%5Bcnpj%5D=00536772000142&&page=1`;
        
       
        
        const resultadoJson = await page.evaluate(async (targetUrl) => {
            const response = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Authorization': 'Guest',
                    'Referer': 'https://consultas.anvisa.gov.br/'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        }, urlApi);

        await browser.close();
        
        // Retorna o JSON limpo da consulta de cosméticos
        return res.json(resultadoJson);

    } catch (error) {
        if (browser) await browser.close();
        return res.status(500).json({ erro: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Microsserviço rodando na porta ${PORT}`);
});
