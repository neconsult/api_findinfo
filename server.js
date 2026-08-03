const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/consulta-anvisa', async (req, res) => {
    const processo = req.query.processo;
    if (!processo) {
        return res.status(400).json({ erro: "Parâmetro 'processo' ausente" });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0');

        // Navega primeiro para a página do portal onde a aplicação Angular/React da Anvisa inicializa os tokens
        const urlPortal = `https://consultas.anvisa.gov.br/#/cosmeticos/detalhe/${processo}/?namespace=&nome=`;
        
        await page.goto(urlPortal, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Aguarda a aplicação processar os scripts de segurança e carregar a API interna
        await new Promise(r => setTimeout(r, 5000));

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
        return res.json(resultadoJson);

    } catch (error) {
        if (browser) await browser.close();
        return res.status(500).json({ erro: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Microsserviço rodando na porta ${PORT}`);
});
