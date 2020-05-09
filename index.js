"use strict";

const fetch = require("node-fetch");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { convertArrayToCSV } = require("convert-array-to-csv");
const { getDataHoraAgora } = require("./utils");

const urlCatalogo =
  "https://olinda.bcb.gov.br/olinda/servico/DASFN/versao/v1/odata/Recursos?$top=10000&$filter=Api%20eq%20'taxas_cartoes'%20and%20Recurso%20eq%20'%2Fitens%2Fultimo'%20and%20Situacao%20eq%20'Produ%C3%A7%C3%A3o'&$format=json";

const headers = {
  Accept: "application/json",
  "cache-control": "no-cache",
};

/** O certificado utilizado pela Caixa apresenta erro, essa configuração bypassa o certificado invalido */
const agent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Monta objeto fetch com as configurações necessárias.
 * Verifica se a url é https ou http só utilizando o Agent se for https.
 * @param {string} url
 */
function fetcher(url) {
  const options = { headers, ...(url.slice(0, 5) === "https" && { agent }) };
  return fetch(url, options);
}

/**
 * Captura taxa via serviço do banco
 * @param {object<{url:string, NomeInstituicao: string, CnpjInstituicao: string}>} dados
 */
function fetchTaxaFromBanco({ url, NomeInstituicao, CnpjInstituicao }) {
  return fetcher(url)
    .then((res) => res.json())
    .then((json) => ({
      url,
      NomeInstituicao,
      CnpjInstituicao,
      dados: json,
      error: false,
    }))
    .catch((error) => ({
      url,
      NomeInstituicao,
      CnpjInstituicao,
      dados: [],
      error,
    }));
}

/**
 * Transforma retorno em CSV
 * @param {Array} data
 * @returns string
 */
function normalizeDataAndConvert2Csv(data) {
  const header = [
    "emissorCnpj",
    "emissorNome",
    "taxaTipoGasto",
    "taxaData",
    "taxaConversao",
    "taxaDivulgacaoDataHora",
  ];
  let dados = data.reduce((acum, cur, index) => {
    const emissorCnpj = cur.dados.emissorCnpj;
    const emissorNome = cur.dados.emissorNome;
    const historicoTaxas = Array.isArray(cur.dados.historicoTaxas)
      ? cur.dados.historicoTaxas
      : [cur.dados.historicoTaxas];

    const taxasBanco = historicoTaxas.map((taxa) => {
      return {
        emissorCnpj,
        emissorNome,
        taxaTipoGasto: (taxa && taxa.taxaTipoGasto) || "Não Informado",
        taxaData: (taxa && taxa.taxaData) || "Não Informado",
        taxaConversao: (taxa && taxa.taxaConversao) || "Não Informado",
        taxaDivulgacaoDataHora:
          (taxa && taxa.taxaDivulgacaoDataHora) || "Não Informado",
      };
    });
    return acum.concat(taxasBanco);
  }, []);

  return convertArrayToCSV(dados);
}

/**
 * Salva arquivos com nome informado e sufixo com data/hora atual
 * @param {string} nome
 * @param {array} dados
 */
function salvaArquivo(nome, dados) {
  nome = `${nome}_${getDataHoraAgora()}.csv`;
  nome = path.resolve(__dirname, "./arquivos", nome);
  fs.writeFile(nome, dados, (err) => {
    if (err) return console.error(err);
    console.log(`Arquivo ${nome} gerado!`);
  });
}

/**
 * Itera dados do catalogo de serviços dos bancos
 * Busca dados por banco, formata em CSV e salva o arquivo em ./arquivos
 * @param {Array} bancos
 */
function getTaxasPorBanco(bancos) {
  const promises = bancos.map((banco) =>
    fetchTaxaFromBanco({
      url: banco.URLDados,
      CnpjInstituicao: banco.CnpjInstituicao,
      NomeInstituicao: banco.NomeInstituicao,
    })
  );
  Promise.all(promises)
    .then((taxas) => {
      const taxasCsv = normalizeDataAndConvert2Csv(
        taxas.filter((t) => t.error === false).map((t) => t)
      );
      const taxasErros = convertArrayToCSV(
        taxas
          .filter((t) => !!t.error)
          .map(({ CnpjInstituicao, NomeInstituicao, error }) => ({
            CnpjInstituicao,
            NomeInstituicao,
            error: error.toString(),
          }))
      );

      salvaArquivo("taxas_bancos", taxasCsv);
      salvaArquivo("taxas_bancos_erros", taxasErros);
    })
    .catch((error) => console.log("vishhh", error));
}

/**
 * Captura catalog de serviços
 */
function fetchCatalogoBancos() {
  fetcher(urlCatalogo)
    .then((res) => res.json())
    .then((json) => {
      getTaxasPorBanco(json.value);
    })
    .catch((err) => console.error(err));
}

fetchCatalogoBancos();
