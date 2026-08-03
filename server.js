const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/consulta-anvisa', async (req, res) => {
    const processo = req.query.processo;
    if (!processo) {
        return res.status(400).json({ erro: "Parâmetro 'processo' ausente" });
    }

    let browser;
    try {
        // Inicializa o browser em modo headless para contornar o Cloudflare
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Define um User-Agent idêntico ao de um navegador real
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0');

        const urlApi = `https://consultas.anvisa.gov.br/api/consulta/cosmeticos/regularizados/${processo}`;

        // Navega diretamente ou abre a página principal primeiro para capturar os cookies do Cloudflare
        await page.goto('https://consultas.anvisa.gov.br/', { waitUntil: 'domcontentloaded' });
        
        // Pequena pausa para garantir a resolução de desafios em segundo plano do WAF
        await new Promise(r => setTimeout(r, 3000));

        // Realiza a requisição injetada no contexto da página para herdar os cookies e headers válidos
        const resultadoJson = await page.evaluate(async (targetUrl) => {
            const response = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Authorization': 'Guest'
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