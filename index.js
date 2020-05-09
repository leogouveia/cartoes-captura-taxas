"use strict";

const fetch = require("node-fetch");
const https = require("https");
const { convertArrayToCSV } = require("convert-array-to-csv");
const { getDataHoraAgora, salvaArquivo } = require("./utils");

async function main() {
  try {
    console.log(". capturando catalogo Emissores");
    const catalogo = await fetchCatalogoEmissores("todos");
    salvaArquivo("catalogo_bancos", convertArrayToCSV(catalogo.value));
    console.log(".. catalogo Emissores capturados");

    console.log(". capturando taxas por emissor");
    const emissores = await Promise.all(
      catalogo.value.map((banco) => {
        console.log(".. capturando emissor: " + banco.NomeInstituicao);
        return fetchTaxaBanco(banco);
      })
    );

    console.log("Formata dados retornados pelos Emissores");
    const dados = formataDadosDosEmissores(emissores);
    const csv = convertArrayToCSV(dados);
    await salvaArquivo("taxas_bancos", csv);
    console.log("Arquivo taxas salvo");

    // salva log de erros
    await salvaArquivo(
      "taxas_bancos_erros",
      convertArrayToCSV(emissores.filter((emissor) => emissor.error))
    );
    console.log("Fim!");
  } catch (error) {
    console.log("main()", error);
  }
}

/**
 * Captura taxa via serviço do banco
 * @param {object<{url:string, NomeInstituicao: string, CnpjInstituicao: string}>} dados
 */
async function fetchTaxaBanco(emissor) {
  const retorno = {
    nomeBanco: emissor.NomeInstituicao,
    cnpjBanco: emissor.CnpjInstituicao,
    error: false,
  };
  try {
    const dados = await fetcher(emissor.URLDados);
    retorno.dados = dados;
    return retorno;
  } catch (error) {
    retorno.error = error.message;
    return retorno;
  }
}

/**
 * Captura catalog de serviços
 */
function fetchCatalogoEmissores(tipo = "ultimo") {
  const recurso = tipo === "ultimo" ? "/itens/ultimo" : "/itens";

  const filtros = encodeURI(
    `$filter=Api eq 'taxas_cartoes' and Recurso eq '${recurso}' and Situacao eq 'Produção'`
  );

  const quantidade = "$top=10000";
  const urlCatalogo = `https://olinda.bcb.gov.br/olinda/servico/DASFN/versao/v1/odata/Recursos?${filtros}&${quantidade}&$format=json`;
  return fetcher(urlCatalogo);
}

function formataDadosDosEmissores(emissores) {
  let retorno = [];
  if (!Array.isArray(emissores)) return false;
  emissores = emissores.filter((b) => !b.error);

  for (let emissor of emissores) {
    const emissorNome = emissor.nomeBanco;
    const emissorCnpj = emissor.cnpjBanco;
    const {
      dados: { historicoTaxas },
    } = emissor;
    const taxas = !Array.isArray(historicoTaxas)
      ? [historicoTaxas]
      : historicoTaxas;
    retorno = retorno.concat(
      taxas.map((taxa) => ({
        emissorNome,
        emissorCnpj,
        taxaTipoGasto: (taxa && taxa.taxaTipoGasto) || "Não Informado",
        taxaData: (taxa && taxa.taxaData) || "Não Informado",
        taxaConversao: (taxa && taxa.taxaConversao) || "Não Informado",
        taxaDivulgacaoDataHora:
          (taxa && taxa.taxaDivulgacaoDataHora) || "Não Informado",
      }))
    );
  }

  return retorno;
}

/**
 * Monta objeto fetch com as configurações necessárias.
 * Verifica se a url é https ou http só utilizando o Agent se for https.
 * @param {string} url
 */
function fetcher(url) {
  const headers = {
    Accept: "application/json",
    "cache-control": "no-cache",
  };

  /** O certificado utilizado pela Caixa apresenta erro, essa configuração bypassa o certificado invalido */
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  const options = { headers, ...(url.slice(0, 5) === "https" && { agent }) };
  return fetch(url, options).then((res) => {
    if (!res.ok) throw Error(`Response not ok: ${res.status}`);
    return res.json();
  });
}

main();
