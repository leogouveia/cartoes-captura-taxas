"use strict";
const path = require("path");
const fs = require("fs");
const Axios = require('axios-https-proxy-fix');
const HttpsProxyAgent = require("https-proxy-agent");
const https = require("https");
const http = require("http");
const { URL } = require("url");
const strftime = require("strftime");

function getDataHoraAgora() {
  return strftime("%Y%m%d%H%M%S%L");
}

/**
 * Salva arquivos com nome informado e sufixo com data/hora atual
 * @param {string} nome
 * @param {array} dados
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
 */
function fetcher(urlString) {
  const url = new URL(urlString);

  const headers = {
    Accept: "application/json",
    "cache-control": "no-cache",
  };

  /** O certificado utilizado pela Caixa apresenta erro, essa configuração bypassa o certificado invalido */
  //  const httpsAgent = new https.Agent({
  //   rejectUnauthorized: false,
  //  });
  // const httpsAgent = new HttpsProxyAgent({host: "localhost", port: "3128", rejectUnauthorized: false})
  const httpAgent = new http.Agent();

  //const agent = url.protocol === "https:" ? httpsAgent : httpAgent;
  //const options = { headers, agent, timeout: 30 * 1000 };

  const axios = Axios.create({
    proxy: {
      host: "localhost",
      port: "3128",
      protocol: 'http',
      rejectUnauthorized: false,
    },    
  })
  
  return axios.get(urlString).then((res) => {
    if (res.statusText !== "OK") throw Error(`Response not ok: ${res.statusText}`);
    return res.data;
  })
}


module.exports = { getDataHoraAgora, salvaArquivo, fetcher };
