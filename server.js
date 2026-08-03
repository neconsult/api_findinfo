const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/consulta-anvisa', async (req, res) => {
    const idDocumento = req.query.id || "25351301175202204";

    let browser;
    try {
        // --- DADOS DO SEU PROXY (SEM SENHA) ---
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

        const urlVisual = `https://consultas.anvisa.gov.br/#/documentos/tecnicos/${idDocumento}/`;
        
        await page.goto(urlVisual, { waitUntil: 'networkidle2', timeout: 30000 });
        
        await new Promise(r => setTimeout(r, 6000));

        const conteudoPagina = await page.evaluate(() => {
            return document.body.innerText;
        });

        await browser.close();
        return res.json({ sucesso: true, dados: conteudoPagina });

    } catch (error) {
        if (browser) await browser.close();
        return res.status(500).json({ erro: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Microsserviço rodando na porta ${PORT}`);
});
