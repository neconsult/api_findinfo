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

    const PROXY_HOST = "190.124.252.129";
    const PROXY_PORT = "6666";

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
                        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJfcjNHNkdEYm41T0Y5LUF2RUxvOHRBOFo4NTlPNkNTR2t1VUdpeC1SWXFJIn0.eyJleHAiOjE3OTEyNTE3ODgsImlhdCI6MTc5MTI1MDA0OCwianRpIjoiODU1MjBjYjktZDU0Ni00NGJlLTlmNWYtODM1ZmU4ZTQ2NWU3IiwiaXNzIjoiaHR0cHM6Ly9hY2Vzc28ucHJkLmFwcHMuYW52aXNhLmdvdi5ici9hdXRoL3JlYWxtcy9leHRlcm5vIiwiYXVkIjpbImNvbnN1bHRhcy1leHRlcm5hcy1zZXJ2aWNlIiwiYWNjb3VudCJdLCJzdWIiOiIwNWM2Yjk5OS0zNDc4LTRiNzYtOTg0ZC0wYzlhNGZhOGJkZWIiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiI4NDcxMDIxNzQ5MSIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiIsImRlZmF1bHQtcm9sZXMtZXh0ZXJubyJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImNvbnN1bHRhcy1leHRlcm5hcy1zZXJ2aWNlIjp7InJvbGVzIjpbIkNPTlNVTFRBU0VYVEVSTkFTX0xFSVRVUkEiXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsImNsaWVudElkIjoiODQ3MTAyMTc0OTEiLCJjbGllbnRIb3N0IjoiMTc5LjE1Mi4yMzAuMTcyIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZXJ2aWNlLWFjY291bnQtODQ3MTAyMTc0OTEiLCJjbGllbnRBZGRyZXNzIjoiMTc5LjE1Mi4yMzAuMTcyIn0.eAYccchVi6CPFIz6c3GfuEwpflSmi67uW31aURMZ2FOulUf-yOnDxPXK7t3hrx0klWKRKfZ_Cxle1_g7EoW1R3l1un7cCcyAM-Zo-lhc2kXh2aTwHSUmq5BwIOQwLxLWBbU6RmO1u8vdNIKjNL0sdtuxUE8SkzMY4RZpfw7txaQmpapYM7zOKSuYAckluGHnH-nYhb8sE3qrC1akNbhIjL32CvV-4A8k9_azbm6k3U1dkzaGdjxiV1YRTzZrLth_a9tRYv39W6fe2OUjRypQecE6MgRTwxNMIgByu3CnPzufQ9awD-Atygx2nq4U7vd5zVU5loEEEk7erianMfMdsg',
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

            console.log(`[TENTATIVA \({tentativa}] Carregando contexto visual:\){urlVisualAlvo}`);

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
            console.log(`[ERRO NA TENTATIVA \({tentativa}]\){error.message}`);
            
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
  const PROXY_HOST = "190.124.252.129";
  const PROXY_PORT = "6666";

  try {
    console.log(`[Anvisa Proxy] Iniciando navegador com Stealth e Proxy para o CNPJ: ${cnpj}`);
    
    browser = await puppeteer2.launch({
      args: [
        ...chromium.args, 
        '--hide-scrollbars', 
        '--disable-web-security', 
         `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
        '--window-size=1366,768'
      ],
      defaultViewport: { width: 1366, height: 768 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    const internalUrl = `https://consultas.anvisa.gov.br/#/saneantes/\${tipo}/q/?cnpj=\${cnpj}`;
    console.log(`[Anvisa Proxy] Acessando diretamente: ${internalUrl}`);

    // Prepara a escuta da API antes de navegar
    const responsePromise = page.waitForResponse(
      response => response.url().includes(`/api/consulta/saneantes/${tipo}`) && response.status() === 200,
      { timeout: 45000 }
    );

    // domcontentloaded evita o travamento de rede da SPA
    await page.goto(internalUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    console.log('[Anvisa Proxy] Página carregada. Capturando resposta da API...');
    
    const apiResponse = await responsePromise;
    const jsonData = await apiResponse.json();

    await browser.close();

    console.log('[Anvisa Proxy] JSON obtido com sucesso.');
    return res.json({
      success: true,
      data: jsonData
    });

  } catch (error) {
    console.error('[Anvisa Proxy Critical Error]:', error.message);
    if (browser) await browser.close();
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
    console.log(`Microsserviço rodando na porta ${PORT}`);
});
