# Cartões Captura Taxas [WIP]

Este script em nodejs tem como objetivo capturar dados de taxas de cambio cobradas pelos emissores de cartões utilizando as plataformas de dados abertos destes emissores.

Para isso o Script busca os recursos (REST) informados na plataforma "Olinda" do Banco Central do Brasil [documentação](https://olinda.bcb.gov.br/olinda/servico/DASFN/versao/v1/aplicacao#!/recursos/Recursos#eyJmb3JtdWxhcmlvIjp7IiR0b3AiOjEwMDAwLCIkZmlsdGVyIjoiBDAEIGVxICd0YXhhc19jYXJ0b2VzJyIsIiRmb3JtYXQiOiJqc29uIn19).

Após capturados os endereços, o script faz requests nas urls para captura das ultimas taxas disponibilizadas.

## Mais informações

- https://dadosabertos.bcb.gov.br/dataset/taxascartoes
