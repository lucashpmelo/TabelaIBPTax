const axios = require("axios").default;
const csvtojson = require("csvtojson");
const fs = require("fs");

const [versao] = process.argv.slice(2);

const UFs = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

const baseURL =
  "http://svn.code.sf.net/p/acbr/code/trunk2/Exemplos/ACBrTCP/ACBrIBPTax/tabela";

const instance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
});

async function getTabelaIbpt(url) {
  const { data } = await instance({ method: "GET", url: url });

  return data;
}

async function run() {
  return Promise.all(
    UFs.map(async (uf) => {
      const data = await getTabelaIbpt(`/TabelaIBPTax${uf}${versao}.csv`);

      fs.writeFileSync(`./IBPT/TabelaIBPTax${uf}.csv`, data);

      const obj = await csvtojson({ delimiter: ";" }).fromString(data);

      const { NCM, NBS, LC116 } = obj.reduce(
        (acc, cur) => {
          const value = {
            codigo: cur.codigo,
            ex: cur.ex,
            tipo: cur.tipo,
            descricao: cur.descricao,
            nacional_federal: parseFloat(cur.nacionalfederal),
            importados_federal: parseFloat(cur.importadosfederal),
            estadual: parseFloat(cur.estadual),
            municipal: parseFloat(cur.municipal),
            vigencia_inicio: cur.vigenciainicio.split("/").reverse().join("-"),
            vigencia_fim: cur.vigenciafim.split("/").reverse().join("-"),
            chave: cur.chave,
            versao: cur.versao,
            fonte: cur.fonte,
          };

          if (value.tipo === "0") acc.NCM.push(value);

          if (value.tipo === "1") acc.NBS.push(value);

          if (value.tipo === "2") acc.LC116.push(value);

          return acc;
        },
        { NCM: [], NBS: [], LC116: [] }
      );

      fs.writeFileSync(`./NCM/TabelaIBPTax${uf}.json`, JSON.stringify(NCM));

      fs.writeFileSync(`./NBS/TabelaIBPTax${uf}.json`, JSON.stringify(NBS));

      fs.writeFileSync(`./LC116/TabelaIBPTax${uf}.json`, JSON.stringify(LC116));

      fs.writeFileSync(`./versao.json`, JSON.stringify({ versao: versao }));

      return {
        uf: uf,
        NCM: NCM.length,
        NBS: NBS.length,
        LC116: LC116.length,
        versao: versao,
      };
    })
  );
}

run()
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
