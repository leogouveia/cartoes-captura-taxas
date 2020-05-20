"use strict";
const path = require("path");
const fs = require("fs");
const Axios = require('axios-https-proxy-fix');
const HttpsProxyAgent = require("https-proxy-agent");
const strftime = require("strftime");

/**
 * Formata data hora para arquivo
 * @returns {string}
 */
function getDataHoraAgora() {
  return strftime("%Y%m%d%H%M%S%L");
}

/**
 * Salva arquivos com nome informado e sufixo com data/hora atual
 * @param {string} nome
 * @param {array} dados
 * @returns {Promise}
 */
function salvaArquivo(nome, dados, timestamps = true) {
  if (timestamps) {
    nome = `${nome}_${getDataHoraAgora()}.csv`;
  } else {
    nome = `${nome}.csv`
  }
  nome = path.resolve(__dirname, "./arquivos", nome);
  return new Promise((resolve, reject) => {
    fs.writeFile(nome, dados, { flag: "w" }, (err) => {
      if (err) return reject(err);
      return resolve(`Arquivo ${nome} gerado!`);
    });
  });
}


/**
 * Monta objeto fetch com as configurações necessárias.
 * Verifica se a url é https ou http só utilizando o Agent se for https.
 * @param {string} url
 * @returns {Primise}
 */
async function fetcher(urlString) {
  /** O certificado utilizado pela Caixa apresenta erro, essa configuração bypassa o certificado invalido */
  const httpsAgent = new HttpsProxyAgent({host: "localhost", port: "3128", rejectUnauthorized: false})

  const axios = Axios.create({
    proxy: {
      host: "localhost",
      port: "3128",
      protocol: 'http',
      rejectUnauthorized: false,
    },    
    httpsAgent,
    timeout: 1 * 60 * 1000 //espera 1minuto
  })
  
  try {
    const res = await axios.get(urlString);
    if (res.statusText !== "OK") throw Error(`Response not ok: ${res.statusText}`);
    return res.data;
  } catch (error) {
    throw error;
  }
}


module.exports = { getDataHoraAgora, salvaArquivo, fetcher };
