const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/consulta-anvisa', async (req, res) => {
    // Exemplo usando o parâmetro da URL que você validou
    const idDocumento = req.query.id || "25351301175202204";

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

        // Navega diretamente para a URL visual que passou na barreira do Cloudflare
        const urlVisual = `https://consultas.anvisa.gov.br/#/documentos/tecnicos/${idDocumento}/`;
        
        await page.goto(urlVisual, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Aguarda os elementos da página renderizarem completamente
        await new Promise(r => setTimeout(r, 6000));

        // Extrai o conteúdo da página ou da API que a página consome internamente
        const conteudoPagina = await page.evaluate(() => {
            return document.body.innerText; // Ou um seletor específico que traga os dados estruturados
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
