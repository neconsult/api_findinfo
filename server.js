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
        const PROXY_HOST = "81.31.146.81";
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
        await page.goto(urlVisual, { waitUntil: 'networkidle2', timeout: 60000 });
        
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
        const PROXY_HOST = "81.31.146.81";
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
        await page.goto(urlVisual, { waitUntil: 'networkidle2', timeout: 60000 });
        
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


app.get('/teste_risco1', async (req, res) => {
    // Recebe o número do processo via query string (padrão de cosméticos)
    const processo = req.query.processo || "25351215885202212";

    let browser;
    try {
        const PROXY_HOST = "81.31.146.81";
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
        await page.goto(urlVisual, { waitUntil: 'networkidle2', timeout: 60000 });
        
        await new Promise(r => setTimeout(r, 4000));

        // 2. Executa o fetch direcionado exatamente para o endpoint de cosméticos da imagem
        //const urlApi = `https://consultas.anvisa.gov.br/api/consulta/saneantes/produtos?column=&count=10&filter%5Bcnpj%5D=00536772000142&order=asc&page=1`;
        const urlApi = `https://consultas.anvisa.gov.br/api/consulta/saneantes/notificados/25351215885202212`;
        
       
        
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

app.get('/teste_risco_erro_tratado', async (req, res) => {
    const processo = req.query.processo || "25351215885202212";
    
    const maxTentativas = 5;
    let tentativa = 0;
    let sucesso = false;
    let resultadoJson = null;
    let ultimoErro = null;

    while (tentativa < maxTentativas && !sucesso) {
        tentativa++;
        let browser = null;

        try {
            const PROXY_HOST = "81.31.146.81";
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

            const urlVisual = `https://consultas.anvisa.gov.br/#/cosmeticos/regularizados/${processo}/?numeroProcesso=${processo}`;
            await page.goto(urlVisual, { waitUntil: 'networkidle2', timeout: 60000 });
            
            await new Promise(r => setTimeout(r, 4000));

            const urlApi = `https://consultas.anvisa.gov.br/api/consulta/saneantes/notificados/${processo}`;
            
            resultadoJson = await page.evaluate(async (targetUrl) => {
                const response = await fetch(targetUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, *_/*',
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
            sucesso = true;

        } catch (error) {
            ultimoErro = error.message;
            if (browser) {
                try { await browser.close(); } catch (e) {}
            }
            if (tentativa < maxTentativas) {
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }

    if (sucesso) {
        // Retorna o JSON de sucesso com estrutura padronizada (opcional, ou apenas o JSON direto)
        return res.json(resultadoJson);
    } else {
        // Tratamento de erro padronizado caso as 5 tentativas falhem
        return res.status(200).json({
            sucesso: false,
            erro: true,
            mensagem: "Não foi possível concluir a consulta na Anvisa após várias tentativas.",
            detalhe: ultimoErro
        });
    }
});

app.get('/teste_otimizado', async (req, res) => {
    const processo = req.query.processo || "25351215885202212";
    
    const maxTentativas = 5;
    let tentativa = 0;
    let sucesso = false;
    let resultadoJson = null;
    let ultimoErro = null;

    while (tentativa < maxTentativas && !sucesso) {
        tentativa++;
        let browser = null;

        try {
            const PROXY_HOST = "81.31.146.81";
            const PROXY_PORT = "3128";

            // Argumentos agressivos para desativar GPU, imagens e cache pesado
            browser = await puppeteer.launch({
                args: [
                    ...chromium.args,
                    `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-sandbox',
                    '--blink-settings=imagesEnabled=false' // Não carrega imagens
                ],
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });

            const page = await browser.newPage();
            
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0');

            // 1. Apenas visitamos a home da Anvisa de forma rápida (domínio raiz) para o Cloudflare registrar o cookie de sessão
            await page.goto('https://consultas.anvisa.gov.br/', { waitUntil: 'domcontentloaded', timeout: 20000 });

            // 2. Executa o fetch direto injetado no contexto já autenticado pela visita
            const urlApi = `https://consultas.anvisa.gov.br/api/consulta/saneantes/notificados/${processo}`;
            
            resultadoJson = await page.evaluate(async (targetUrl) => {
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
            sucesso = true;

        } catch (error) {
            ultimoErro = error.message;
            if (browser) {
                try { await browser.close(); } catch (e) {}
            }
            if (tentativa < maxTentativas) {
                // Intervalo menor entre as tentativas para não perder tempo
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    if (sucesso) {
        return res.json(resultadoJson);
    } else {
        return res.status(200).json({
            sucesso: false,
            erro: true,
            mensagem: "Não foi possível concluir a consulta na Anvisa após várias tentativas.",
            detalhe: ultimoErro
        });
    }
});


app.listen(PORT, () => {
    console.log(`Microsserviço rodando na porta ${PORT}`);
});
