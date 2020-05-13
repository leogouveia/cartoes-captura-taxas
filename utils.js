"use strict";
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
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
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });
  const httpAgent = new http.Agent();
  const agent = url.protocol === "https:" ? httpsAgent : httpAgent;
  const options = { headers, agent };

  return fetch(url, options).then((res) => {
    if (!res.ok) throw Error(`Response not ok: ${res.status}`);
    return res.json();
  });
}


module.exports = { getDataHoraAgora, salvaArquivo, fetcher };
