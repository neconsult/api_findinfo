const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');


const app = express();
const PORT = process.env.PORT || 3000;

// Variáveis globais para armazenar o cache de sessão na memória do Render
let cachedCookies = null;
let sessionTimestamp = 0;
const SESSION_TTL = 15 * 60 * 1000; // Validade da sessão: 15 minutos


// --- VARIÁVEL GLOBAL APENAS PARA O BROWSER ---
let globalBrowser = null;

async function getBrowserInstance() {
    // Se o browser já existe e está conectado, reaproveita ele inteiro
    if (globalBrowser && globalBrowser.isConnected()) {
        return globalBrowser;
    }

    const PROXY_HOST = "190.124.252.129".trim();
    const PROXY_PORT = "6666".trim();

    console.log("[INICIALIZAÇÃO] Subindo instância master do Chromium...");
    globalBrowser = await puppeteer.launch({
        args: [
            ...chromium.args,
            `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-sandbox'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });

    return globalBrowser;
}

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
    
    const maxTentativas = 10;
    let tentativa = 0;
    let sucesso = false;
    let resultadoJson = null;
    let ultimoErro = null;

    while (tentativa < maxTentativas && !sucesso) {
        tentativa++;
        let browser = null;

        try {
            const PROXY_HOST = "187.44.188.238";
            const PROXY_PORT = "4040";

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
            await page.goto('https://consultas.anvisa.gov.br/#/saneantes/notificados/25351500629202139/?cnpj=01358874000188', { waitUntil: 'domcontentloaded', timeout: 90000 });

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

app.get('/teste_otimizado2', async (req, res) => {
    const processo = req.query.processo || "25351215885202212";
    // --- const urlApi = `https://consultas.anvisa.gov.br/api/consulta/saneantes/notificados/${processo}`;

    const urlParam = req.query.url;
    
    if (!urlParam) {
        return res.status(400).json({
            sucesso: false,
            erro: true,
            mensagem: "O parâmetro 'url' é obrigatório. Exemplo: /teste_otimizado2?url=https://consultas.anvisa.gov.br/api/..."
        });
    }

    const urlApi = decodeURIComponent(urlParam);    

    // const urlApi =`https://consultas.anvisa.gov.br/api/consulta/saneantes/notificados?count=500&filter[cnpj]=05855974000170&page=1`;
    
    const maxTentativas = 10;
    let tentativa = 0;
    let sucesso = false;
    let resultadoJson = null;
    let ultimoErro = null;

    while (tentativa < maxTentativas && !sucesso) {
        tentativa++;
        
        const agora = Date.now();
        const sessaoValida = cachedCookies && (agora - sessionTimestamp < SESSION_TTL);

        try {
           
            let browser = null;
            try {
                const PROXY_HOST = "190.124.252.129";
                const PROXY_PORT = "6666";

                browser = await puppeteer.launch({
                    args: [
                        ...chromium.args,
                        `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
                        '--disable-gpu',
                        '--disable-dev-shm-usage',
                        '--disable-setuid-sandbox',
                        '--no-sandbox'
                    ],
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath(),
                    headless: chromium.headless,
                    ignoreHTTPSErrors: true,
                });

                const page = await browser.newPage();
                
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    const resourceType = req.resourceType();
                    if (['image', 'stylesheet', 'font', 'media', 'other'].includes(resourceType)) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });

                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0');

                await page.goto('https://consultas.anvisa.gov.br/#', { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 100000 
                });
                
                await new Promise(r => setTimeout(r, 1000));

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

            } catch (innerError) {
                if (browser) {
                    try { await browser.close(); } catch (e) {}
                }
                throw innerError;
            }

        } catch (error) {
            ultimoErro = error.message;

            if (tentativa < maxTentativas) {
                await new Promise(r => setTimeout(r, 400));
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


app.get('/teste_otimizado3', async (req, res) => {
    const urlParam = req.query.url;
    
    if (!urlParam) {
        return res.status(400).json({
            sucesso: false,
            erro: true,
            mensagem: "O parâmetro 'url' é obrigatório."
        });
    }

    const urlApi = decodeURIComponent(urlParam);
    
    const maxTentativas = 3;
    let tentativa = 0;
    let sucesso = false;
    let resultadoJson = null;
    let ultimoErro = null;

    while (tentativa < maxTentativas && !sucesso) {
        tentativa++;
        let page = null;

        try {
            // Pega o browser global (ou cria se não existir)
            const browser = await getBrowserInstance();
            
            // Abre uma NOVA ABA isolada para esta requisição específica
            page = await browser.newPage();
            
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (['image', 'stylesheet', 'font', 'media', 'other'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0');

            // Navega na aba isolada
            await page.goto('https://consultas.anvisa.gov.br/#', { 
                waitUntil: 'domcontentloaded', 
                timeout: 30000 
            });
            
            await new Promise(r => setTimeout(r, 800));

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

            // Fecha apenas a aba usada, mantendo o navegador principal vivo na memória para a próxima
            await page.close();
            sucesso = true;

        } catch (error) {
            ultimoErro = error.message;
            
            // Fecha a aba se ela chegou a abrir e travou
            if (page) {
                try { await page.close(); } catch (e) {}
            }

            // Se o navegador master travou inteiro, limpamos a referência global
            if (!globalBrowser || !globalBrowser.isConnected()) {
                globalBrowser = null;
            }

            if (tentativa < maxTentativas) {
                await new Promise(r => setTimeout(r, 300));
            }
        }
    }

    if (sucesso) {
        return res.json(resultadoJson);
    } else {
        return res.status(200).json({
            sucesso: false,
            erro: true,
            mensagem: "Não foi possível concluir a consulta na Anvisa.",
            detalhe: ultimoErro
        });
    }
});

app.listen(PORT, () => {
    console.log(`Microsserviço rodando na porta ${PORT}`);
});
