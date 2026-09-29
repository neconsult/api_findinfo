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

    const PROXY_HOST = "186.216.208.98";
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
            '--no-sandbox'
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
    
    const maxTentativas = 2;
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

// Esconde o fato de que a aba está sendo controlada por robô
await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
    });
    // Simula plugins reais de navegador
    Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
    });
    // Simula linguagens aceitas
    Object.defineProperty(navigator, 'languages', {
        get: () => ['pt-BR', 'pt', 'en-US', 'en'],
    });
});            
            
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                // Permitimos scripts e xhr para que o Angular e o Cloudflare rodem perfeitamente
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0');

            // 1. Monta a URL visual correspondente
            let urlVisualAlvo = 'https://consultas.anvisa.gov.br/#/';
            if (urlApi.includes('/api/documento/')) {
                const partes = urlApi.split('/');
                const idDoc = partes[partes.length - 1];
                urlVisualAlvo = `https://consultas.anvisa.gov.br/#/documentos/tecnicos/${idDoc}/`;
            } else if (urlApi.includes('/saneantes/')) {
                urlVisualAlvo = 'https://consultas.anvisa.gov.br/#/saneantes/notificados/';
            }

            console.log(`[NAVEGAÇÃO TENTATIVA \({tentativa}] Abrindo:\){urlVisualAlvo}`);

            // 2. Navega para a página visual e aguarda a estabilização completa da SPA
            await page.goto(urlVisualAlvo, { 
                waitUntil: 'networkidle0', // Aguarda a rede ficar completamente ociosa (garante que o Cloudflare passou e o Angular carregou)
                timeout: 60000 
            });

            // 3. Dá uma folga para o front-end renderizar os componentes e disparar o carregamento
            await new Promise(r => setTimeout(r, 4000));

            // 4. Com a sessão 100% autenticada e aquecida na aba, executamos o fetch diretamente de dentro do contexto do navegador
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
            console.log(`[ERRO NA TENTATIVA \({tentativa}]\){error.message}`);
            
            if (page) {
                try { await page.close(); } catch (e) {}
            }

            if (error.message.includes("CLOUD_FLARE_403_BLOCK") || !globalBrowserProc || !globalBrowserProc.isConnected()) {
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

app.listen(PORT, () => {
    console.log(`Microsserviço rodando na porta ${PORT}`);
});
