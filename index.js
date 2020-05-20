"use strict";

const { convertArrayToCSV } = require("convert-array-to-csv");
const { salvaArquivo, fetcher } = require("./utils");

async function main() {
  try {
    const args = process.argv.slice(2).map(arg => arg.replace("--", ""));
    const arg1 = args[0] || "ultimo"
    console.log(arg1)
    console.log(". capturando catalogo Emissores");
    const catalogo = await fetchCatalogoEmissores(arg1);
    salvaArquivo("catalogo_bancos", convertArrayToCSV(catalogo.value));
    console.log(".. catalogo Emissores capturados");

    console.log(". capturando taxas por emissor");
    const emissores = await Promise.all(
      catalogo.value.map((emissor) => fetchTaxaEmissor(emissor))
    );

    console.log("Formata dados retornados pelos Emissores");
    const dados = formataDadosDosEmissores(emissores);
    const csv = convertArrayToCSV(dados);
    await salvaArquivo("taxas_bancos", csv);
    await salvaArquivo("taxas_bancos", csv, false);
    console.log("Arquivo taxas salvo");

    // salva log de erros
    await salvaArquivo(
      "taxas_bancos_erros",
      convertArrayToCSV(emissores.filter((emissor) => emissor.error))
    );
    console.log("Fim!");
    process.exit(1);
  } catch (error) {
    console.log("main()", error);
    process.exit(0);
  }
}

/**
 * Captura taxa via serviço do banco
 * @param {object<{url:string, NomeInstituicao: string, CnpjInstituicao: string}>} dados
 * @returns {Promise<object>}
 */
async function fetchTaxaEmissor(emissor) {
  const retorno = {
    nomeBanco: emissor.NomeInstituicao,
    cnpjBanco: emissor.CnpjInstituicao,
    error: false,
  };
  try {
    const dados = await fetcher(emissor.URLDados);
    retorno.dados = dados;
    console.log("fetched ", emissor.NomeInstituicao)
    return retorno;
  } catch (error) {
    retorno.error = error.message;
    console.log("error ", emissor.NomeInstituicao)
    return retorno;
  }
}

/**
 * Captura catalog de serviços
 * 
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

main();
