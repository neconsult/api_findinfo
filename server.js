const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');


const app = express();
const PORT = process.env.PORT || 3000;

// Variáveis globais para armazenar o cache de sessão na memória do Render
let cachedCookies = null;
let sessionTimestamp = 0;
const SESSION_TTL = 15 * 60 * 1000; // Validade da sessão: 15 minutos


// --- VARIÁVEIS GLOBAIS PARA O NAVEGADOR PERSISTENTE ---
let globalBrowser = null;
let globalPage = null;

async function getBrowserInstance() {
    // Se já existe e está conectado, reaproveita
    if (globalBrowser && globalBrowser.isConnected()) {
        return { browser: globalBrowser, page: globalPage };
    }

    const PROXY_HOST = "200.128.84.82";
    const PROXY_PORT = "3128";

    console.log("[INICIALIZAÇÃO] Subindo instância persistente do Chromium...");
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

    globalPage = await globalBrowser.newPage();
    
    // Configura o bloqueio de recursos pesados uma única vez
    await globalPage.setRequestInterception(true);
    globalPage.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media', 'other'].includes(resourceType)) {
            req.abort();
        } else {
            req.continue();
        }
    });

    // Acessa a raiz para passar pelo Cloudflare inicial
    await globalPage.goto('https://consultas.anvisa.gov.br/#', { 
        waitUntil: 'domcontentloaded', 
        timeout: 120000 
    });
    
    await new Promise(r => setTimeout(r, 2500));
    
    return { browser: globalBrowser, page: globalPage };
}

let globalBrowserProc = null;

async function getBrowserInstanceProc() {
    // Se o browser já existe e está conectado, reaproveita a instância principal
    if (globalBrowserProc && globalBrowserProc.isConnected()) {
        return globalBrowserProc;
    }

    const PROXY_HOST = "190.124.252.129";
    const PROXY_PORT = "6666";

    console.log("[INICIALIZAÇÃO] Subindo instância master persistente do Chromium...");
    globalBrowserProc = await puppeteer.launch({
        args: [
            ...chromium.args,
            `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-sandbox',
            // --- NOVOS ARGUMENTOS PARA EVITAR DETECTION DE HEADLESS ---
            '--disable-blink-features=AutomationControlled', // Remove a flag que denuncia automação
            '--window-size=1920,1080',
            '--start-maximized',
            '--lang=pt-BR,pt;q=0.9',
            '--no-first-run',
            '--no-default-browser-check'
        ],
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });

    return globalBrowserProc;

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
    
    const maxTentativas = 5;
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
            mensagem: "O parâmetro 'url' é obrigatório. Exemplo: /teste_otimizado2?url=https://consultas.anvisa.gov.br/api/..."
        });
    }

    const urlApi = decodeURIComponent(urlParam);
    
    const maxTentativas = 5;
    let tentativa = 0;
    let sucesso = false;
    let resultadoJson = null;
    let ultimoErro = null;

    while (tentativa < maxTentativas && !sucesso) {
        tentativa++;

        try {
            // Pega a instância já aberta em background
            const { page } = await getBrowserInstance();

            // Executa o fetch diretamente na página que já está com a sessão ativa
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

            sucesso = true;

        } catch (error) {
            ultimoErro = error.message;
            
            // Se der erro (ex: Cloudflare derrubou a sessão da aba), destruímos a instância global para forçar uma nova limpa na próxima tentativa
            if (globalBrowser) {
                try { await globalBrowser.close(); } catch (e) {}
            }
            globalBrowser = null;
            globalPage = null;

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

const axios = require('axios'); // Garanta que o axios está instalado no projeto (npm install axios)

app.get('/teste_otimizadoproc', async (req, res) => {
    const urlParam = req.query.url;
    
    if (!urlParam) {
        return res.status(400).json({
            sucesso: false,
            erro: true,
            mensagem: "O parâmetro 'url' é obrigatório."
        });
    }

    const urlApi = decodeURIComponent(urlParam);
    
    const maxTentativas = 2;
    let tentativa = 0;
    let sucesso = false;
    let resultadoJson = null;
    let ultimoErro = null;

    while (tentativa < maxTentativas && !sucesso) {
        tentativa++;
        let page = null;

        try {
            const browser = await getBrowserInstanceProc();
            page = await browser.newPage();
            
            // Camuflagem anti-bot na aba
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
            });

            let urlVisualAlvo = 'https://consultas.anvisa.gov.br/#/';
            if (urlApi.includes('/api/documento/')) {
                const partes = urlApi.split('/');
                const idDoc = partes[partes.length - 1];
                urlVisualAlvo = `https://consultas.anvisa.gov.br/#/documentos/tecnicos/${idDoc}/`;
            } else if (urlApi.includes('/saneantes/')) {
                urlVisualAlvo = 'https://consultas.anvisa.gov.br/#/saneantes/notificados/';
            }

            console.log(`[TENTATIVA ${tentativa}] Carregando contexto visual:${urlVisualAlvo}`);

            // 1. Navega para a página visual para o Cloudflare liberar a sessão na aba
            await page.goto(urlVisualAlvo, { 
                waitUntil: 'networkidle2', 
                timeout: 60000 
            });

            // Aguarda o processamento do desafio do Cloudflare
            await new Promise(r => setTimeout(r, 4000));

            console.log(`[TENTATIVA ${tentativa}] Executando fetch interno com o TLS do navegador...`);

            // 2. Executa o fetch DIRETAMENTE de dentro da aba do navegador (aproveitando o TLS e os cookies válidos)
            resultadoJson = await page.evaluate(async (targetUrl) => {
                const response = await fetch(targetUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Authorization': 'Guest',
                        'Referer': 'https://consultas.anvisa.gov.br/'
                    }
                });

                if (response.status === 403) {
                    throw new Error("CLOUD_FLARE_403_BLOCK");
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const rawText = await response.text();
                if (!rawText || rawText.trim() === "") {
                    throw new Error("EMPTY_JSON_RESPONSE");
                }

                return JSON.parse(rawText);
            }, urlApi);

            await page.close();
            sucesso = true;

        } catch (error) {
            ultimoErro = error.message;
            console.log(`[ERRO NA TENTATIVA ${tentativa}] ${error.message}`);
            
            if (page) {
                try { await page.close(); } catch (e) {}
            }

            if (error.message.includes("403") || error.message.includes("CLOUD_FLARE_403_BLOCK") || !globalBrowserProc || !globalBrowserProc.isConnected()) {
                console.log("[SEGURANÇA] Reinicializando o Chromium master devido a bloqueio...");
                if (globalBrowserProc) {
                    try { await globalBrowserProc.close(); } catch (e) {}
                }
                globalBrowserProc = null;
            }

            if (tentativa < maxTentativas) {
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }

    if (sucesso) {
        return res.json(resultadoJson);
    } else {
        return res.status(200).json({
            sucesso: false,
            erro: true,
            mensagem: "Não foi possível concluir a consulta na Anvisa após análise do fluxo.",
            detalhe: ultimoErro
        });
    }
});


const puppeteer2 = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer2.use(StealthPlugin());

app.get('/test-saneantes', async (req, res) => {
  let browser;
  const cnpj = req.query.cnpj || '00536772000142';
  const tipo = req.query.tipo || 'produtos';  
  const PROXY_HOST = "201.20.42.46";
  const PROXY_PORT = "3128";

  let maxTentativas = 3;
  let tentativa = 0;
  let sucesso = false;
  let interceptedData = null;

  while (tentativa < maxTentativas && !sucesso) {
    tentativa++;
    let browser = null;

    console.log(`[Anvisa Telemetria] === INÍCIO DA TENTATIVA ${tentativa} de ${maxTentativas} (CNPJ: ${cnpj}) ===`);

    try {
      await new Promise(async (resolve, reject) => {
        // Timeout de segurança de 40 segundos para esta tentativa
        let timeoutHandle = setTimeout(() => {
          reject(new Error("Timeout estrito de 300s atingido na tentativa atual."));
        }, 300000);

        try {
          console.log(`[Tentativa ${tentativa}] Lançando instância do Chromium com proxy ${PROXY_HOST}:${PROXY_PORT}...`);
          
          browser = await puppeteer2.launch({
            args: [
              ...chromium.args, 
               `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
              '--hide-scrollbars', 
              '--disable-web-security', 
              '--window-size=1366,768',
              '--no-sandbox',
              '--disable-setuid-sandbox'
            ],
            defaultViewport: { width: 1366, height: 768 },
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
          });

          const page = await browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

          // Monitor de rede detalhado para capturar a chamada da API
          page.on('response', async (response) => {
            const url = response.url();
            const status = response.status();
            if (!url.includes('.js') && !url.includes('.css') && !url.includes('.png') && !url.includes('.ico') && !url.includes('.svg')) {
              console.log(`[Rede IN] Status ${status} <-${url}`);
            }
            if (url.includes(`/api/consulta/saneantes/produtos`)) {
              console.log(`[Telemetria Rede] Resposta capturada da API -> URL: ${url} | Status: ${response.status()}`);
              if (url.includes(cnpj) && response.status() === 200) {
                try {
                  const json = await response.json();
                  if (json) {
                    console.log(`[Telemetria Sucesso] JSON da API interceptado com sucesso na tentativa ${tentativa}!`);
                    interceptedData = json;
                    sucesso = true;
                    clearTimeout(timeoutHandle);
                    resolve();
                  }
                } catch (parseErr) {
                  console.warn(`[Telemetria Erro] Falha ao fazer parse do JSON interceptado:`, parseErr.message);
                }
              }
            }
          });

          const friendlyUrl = `https://consultas.anvisa.gov.br/#/saneantes/produtos/q/?cnpj=00536772000142`;
          console.log(`[Tentativa ${tentativa}] Navegando diretamente para a URL amigável: ${friendlyUrl}`);

          // Navega usando domcontentloaded para evitar bloqueios em recursos estáticos secundários
          await page.goto(friendlyUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 900000
          });
          console.log(`[Tentativa ${tentativa}] Página carregada. Simulando interação humana para destravar o Cloudflare Challenge...`);
          
          // Simula ações físicas na tela (movimento de mouse e cliques) exigidas pelos scripts de borda
          await page.mouse.move(200, 200);
          await page.mouse.down();
          await page.mouse.up();
          await page.evaluate(() => window.scrollBy(0, 250));
            
          console.log(`[Tentativa ${tentativa}] Página carregada. Aguardando o Angular disparar o request de rede da API...`);
          
            // Aguarda o tempo necessário para o Cloudflare validar e o Angular renderizar
          let tempoEspera = 0;
          while (!sucesso && tempoEspera < 60) {
            await new Promise(r => setTimeout(r, 1000));
            tempoEspera++;
          }
          // Fica em loop ativo aguardando o ouvinte de rede capturar o dado
          tempoEspera = 0;
          while (!sucesso && tempoEspera < 60) {
            await new Promise(r => setTimeout(r, 1000));
            tempoEspera++;
            if (tempoEspera % 5 === 0) {
              console.log(`[Tentativa ${tempoEspera}s] Aguardando resposta da API... (Tentativa ${tentativa})`);
            }
          }

          if (!sucesso) {
            console.warn(`[Tentativa ${tentativa}] Tempo limite de espera pela API esgotado nesta tentativa.`);
          }

          clearTimeout(timeoutHandle);
          resolve();

        } catch (innerErr) {
          clearTimeout(timeoutHandle);
          reject(innerErr);
        }
      });

    } catch (err) {
      console.warn(`[Anvisa Telemetria] -> [FALHA na tentativa ${tentativa}: ${err.message}]`);
    } finally {
      if (browser) {
        console.log(`[Tentativa ${tentativa}] Fechando navegador e liberando recursos...`);
        try {
          const proc = browser.process();
          if (proc && proc.pid) {
            process.kill(proc.pid, 'SIGKILL');
          } else {
            await browser.close();
          }
        } catch (e) {}
        browser = null;
      }
    }

    if (sucesso && interceptedData) {
      console.log(`[Anvisa Telemetria] === FLUXO CONCLUÍDO COM SUCESSO NA TENTATIVA ${tentativa} ===`);
      break;
    }

    if (!sucesso && tentativa < maxTentativas) {
      console.log(`[Anvisa Telemetria] Pausando 2 segundos antes de iniciar a próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (!sucesso || !interceptedData) {
    console.error(`[Anvisa Telemetria] === TODAS AS ${maxTentativas} TENTATIVAS FALHARAM ===`);
    return res.status(504).json({
      success: false,
      message: "Todas as tentativas esgotaram sem que a API respondesse com o JSON esperado. Verifique os logs do Render para detalhes."
    });
  }

  return res.json({
    success: true,
    data: interceptedData
  });
});

app.get('/test-saneantes-stealth-telemetria', async (req, res) => {
const cnpj = req.query.cnpj || '00536772000142';
  const tipo = req.query.tipo || 'produtos';  
  const PROXY_HOST = "201.20.42.46";
  const PROXY_PORT = "3128";

let maxTentativas = 3;
  let tentativa = 0;
  let sucesso = false;
  let apiResult = null;

  while (tentativa < maxTentativas && !sucesso) {
    tentativa++;
    let browser = null;

    console.log(`[Cloudflare Engine] === INÍCIO DA TENTATIVA ${tentativa} de ${maxTentativas} (CNPJ: ${cnpj}) ===`);

    try {
      await new Promise(async (resolve, reject) => {
        // Timeout global estendido para 3 minutos devido à latência do proxy
        let timeoutHandle = setTimeout(() => {
          reject(new Error("Timeout global de 180s esgotado considerando a lentidão do proxy."));
        }, 180000);

        try {
          console.log(`[Tentativa ${tentativa}] Lançando Chromium Stealth com proxy ${PROXY_HOST}:${PROXY_PORT}...`);
          
          browser = await puppeteer2.launch({
            args: [
              ...chromium.args, 
              `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
              '--hide-scrollbars', 
              '--disable-web-security', 
              '--window-size=1366,768',
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-blink-features=AutomationControlled'
            ],
            defaultViewport: { width: 1366, height: 768 },
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
          });

          const page = await browser.newPage();
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

          // Monitor de rede estrito
          page.on('response', (response) => {
            const url = response.url();
            const status = response.status();
            if (url.includes('consultas.anvisa.gov.br')) {
              console.log(`[Rede Monitor] Status ${status} <- ${url}`);
            }
          });

          const homeUrl = `https://consultas.anvisa.gov.br/`;
          console.log(`[Tentativa ${tentativa}] Acessando home base com timeout estendido de 75s...`);

          await page.goto(homeUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 75000
          }).catch(e => console.log(`[Aviso Goto] ${e.message}`));

          console.log(`[Tentativa ${tentativa}] Página aberta. Iniciando janela estendida (60s) de resolução do Turnstile...`);

          // FASE 1: Janela ampla (60 segundos) para acomodar a lentidão do proxy ao processar o desafio
          let desafioSuperado = false;
          for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 1000));
            
            const pageTitle = await page.title().catch(() => '');
            
            if (i % 5 === 0) {
              console.log(`[Borda ${i+1}s] Título atual da aba: "${pageTitle}"`);
            }

            if (pageTitle && !pageTitle.includes('Just a moment') && !pageTitle.includes('Checking') && !pageTitle.includes('Aguarde')) {
              desafioSuperado = true;
              console.log(`[Cloudflare] Desafio absorvido e superado com sucesso no segundo ${i+1}! Título: "${pageTitle}"`);
              break;
            }

            // Interação contínua com o iframe do Turnstile durante toda a janela
            try {
              const frames = page.frames();
              for (const f of frames) {
                if (f.url().includes('challenges.cloudflare.com')) {
                  await f.evaluate(() => {
                    const cb = document.querySelector('input[type="checkbox"]') || document.querySelector('.cb-i');
                    if (cb) cb.click();
                  }).catch(() => {});
                }
              }

              const iframeElement = await page.$('iframe[src*="challenges.cloudflare.com"]');
              if (iframeElement) {
                const box = await iframeElement.boundingBox();
                if (box) {
                  await page.mouse.click(box.x + 30, box.y + 30);
                }
              }
            } catch (errFrame) {}
          }

          // FASE 2: Janela estendida (20 segundos) para confirmação do cookie cf_clearance
          console.log(`[Tentativa ${tentativa}] Aguardando consolidação do cookie cf_clearance via proxy...`);
          let sessaoValida = false;
          for (let c = 0; c < 20; c++) {
            await new Promise(r => setTimeout(r, 1000));
            const cookies = await page.cookies();
            const clearanceCookie = cookies.find(cookie => cookie.name === 'cf_clearance');
            if (clearanceCookie) {
              console.log(`[Sessão] Cookie cf_clearance confirmado após ${c+1} segundos de espera!`);
              sessaoValida = true;
              break;
            }
          }

          if (!sessaoValida) {
            console.warn(`[Aviso Sessão] Cookie cf_clearance demorou a aparecer, mas vamos tentar o fetch mesmo assim.`);
          }

          // FASE 3: Consumo da API na Mesma Instância Aquecida
          const targetApiUrl = `https://consultas.anvisa.gov.br/api/consulta/saneantes/${tipo}?column=&count=10&filter%5Bcnpj%5D=${cnpj}&order=asc&page=1`;
          console.log(`[Tentativa ${tentativa}] Executando fetch interno na API: ${targetApiUrl}`);

          apiResult = await page.evaluate(async (url) => {
            try {
              const res = await fetch(url, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json, text/plain, */*',
                  'Referer': 'https://consultas.anvisa.gov.br/'
                }
              });
              const text = await res.text();
              return { status: res.status, ok: res.ok, body: text };
            } catch (err) {
              return { success: false, error: err.toString() };
            }
          }, targetApiUrl);

          console.log(`[Tentativa ${tentativa}] Status HTTP retornado pela API alvo:`, apiResult.status);

          if (apiResult && apiResult.status === 200 && apiResult.body && apiResult.body.startsWith('{')) {
            apiResult.data = JSON.parse(apiResult.body);
            sucesso = true;
          } else {
            console.warn(`[Tentativa ${tentativa}] A API retornou conteúdo não-esperado:`, apiResult.body ? apiResult.body.substring(0, 200) : 'Vazio');
          }

          clearTimeout(timeoutHandle);
          resolve();

        } catch (innerErr) {
          clearTimeout(timeoutHandle);
          reject(innerErr);
        }
      });

    } catch (err) {
      console.warn(`[Cloudflare Engine] -> [FALHA na tentativa ${tentativa}: ${err.message}]`);
    } finally {
      if (browser) {
        console.log(`[Tentativa ${tentativa}] Fechando navegador e liberando recursos...`);
        try {
          const proc = browser.process();
          if (proc && proc.pid) process.kill(proc.pid, 'SIGKILL');
          else await browser.close();
        } catch (e) {}
        browser = null;
      }
    }

    if (sucesso && apiResult) {
      console.log(`[Cloudflare Engine] === SUCESSO DEFINITIVO NA TENTATIVA ${tentativa} ===`);
      break;
    }

    if (!sucesso && tentativa < maxTentativas) {
      console.log(`[Cloudflare Engine] Pausando 5 segundos antes da próxima tentativa...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  if (!sucesso || !apiResult) {
    console.error(`[Cloudflare Engine] === TODAS AS ${maxTentativas} TENTATIVAS FALHARAM ===`);
    return res.status(504).json({
      success: false,
      message: "Todas as tentativas esgotaram mesmo com os tempos estendidos para o proxy."
    });
  }

  return res.json({
    success: true,
    data: apiResult.data
  });
});
app.listen(PORT, () => {
    console.log(`Microsserviço rodando na porta ${PORT}`);
});
