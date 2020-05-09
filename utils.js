"use strict";
const path = require("path");
const fs = require("fs");
const strftime = require("strftime");

function pad(value = "", width, n = "0") {
  value = value ? `${value}` : "";
  let zeros = new Array(width - value.length + 1).join(n);
  return value.length >= width ? value : `${zeros}${value}`;
}

function getDataHoraAgora() {
  return strftime("%Y%m%d%H%M%S%L");
}

/**
 * Salva arquivos com nome informado e sufixo com data/hora atual
 * @param {string} nome
 * @param {array} dados
 */
function salvaArquivo(nome, dados) {
  nome = `${nome}_${getDataHoraAgora()}.csv`;
  nome = path.resolve(__dirname, "./arquivos", nome);
  return new Promise((resolve, reject) => {
    fs.writeFile(nome, dados, (err) => {
      if (err) return reject(err);
      return resolve(`Arquivo ${nome} gerado!`);
    });
  });
}

module.exports = { getDataHoraAgora, salvaArquivo };
