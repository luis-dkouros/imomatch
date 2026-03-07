import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL; // 
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const INTERESTS = ["Apartamento","Moradia","Terreno","Comercial","Investimento"];
const TYPOLOGIES = ["T0","T1","T2","T3","T4+"];
const PRICE_RANGES = ["Até 100k€","100k–200k€","200k–350k€","350k–500k€","500k€+"];

const PORTUGAL = {
  "Aveiro": {
    "Águeda":["Aguada de Baixo","Aguada de Cima","Águeda","Barrô","Belazaima do Chão","Castanheira do Vouga","Fermentelos","Macinhata do Vouga","Recardães","Travassô","Trofa","Valongo do Vouga"],
    "Albergaria-a-Velha":["Albergaria-a-Velha","Alquerubim","Branca","Frossos","Ribeira de Fráguas","Valmaior"],
    "Anadia":["Amoreira do Vouga","Anadia","Arcos","Avelãs de Caminho","Avelãs de Cima","Moita","Paredes do Bairro","São Lourenço do Bairro","Vila Nova de Monsarros"],
    "Arouca":["Arouca","Burgo","Chave","Covelo de Paivó","Escariz","Espiunca","Fermedo","Janarde","Moldes","Mansores","Rossas","Santa Eulália","São Miguel do Mato","Várzea","Vilarinho"],
    "Aveiro":["Aradas","Aveiro","Cacia","Eixo","Esgueira","Glória","Nariz","Oliveirinha","Requeixo","Santa Joana","São Bernardo","São Jacinto","Vera Cruz"],
    "Castelo de Paiva":["Bairros","Castelo de Paiva","Fornos","Mouquim","Pedorido","Raiva","Real","Santa Maria de Sardoura"],
    "Espinho":["Anta","Espinho","Guetim","Paramos","Silvalde"],
    "Estarreja":["Avanca","Beduído","Canelas","Fermelã","Pardilhó","Salreu","Veiros"],
    "Ílhavo":["Gafanha da Encarnação","Gafanha da Nazaré","Gafanha do Carmo","Ílhavo","São Salvador"],
    "Mealhada":["Barcouço","Casal Comba","Luso","Mealhada","Pampilhosa","Vacariça","Ventosa do Bairro"],
    "Murtosa":["Bunheiro","Monte","Murtosa","Torreira"],
    "Oliveira de Azeméis":["Cesar","Fajões","Loureiro","Macieira de Sarnes","Nogueira do Cravo","Oliveira de Azeméis","Ossela","Palmaz","Pinheiro da Bemposta","Santiago de Riba-Ul","São Roque","Travanca","Ul","Vila de Cucujães"],
    "Oliveira do Bairro":["Oiã","Oliveira do Bairro","Palhaça","Tamengos"],
    "Ovar":["Arada","Cortegaça","Esmoriz","Maceda","Ovar","São João de Ovar","São Vicente de Pereira","Válega"],
    "Santa Maria da Feira":["Argoncilhe","Arrifana","Caldas de São Jorge","Canedo","Escapães","Feira","Fiães","Fornos","Louredo","Lourosa","Milheirós de Poiares","Mosteiro","Mozelos","Nogueira da Regedoura","Paços de Brandão","Rio Meão","Romariz","Sanfins","Santa Maria de Lamas","São João de Ver","Souto","Travanca"],
    "São João da Madeira":["São João da Madeira"],
    "Sever do Vouga":["Dornelas","Rocas do Vouga","Sever do Vouga","Silva Escura","Talhadas"],
    "Vagos":["Covão do Lobo","Fonte de Angeão","Gafanha da Boa Hora","Ouca","Santo André de Vagos","Sosa","Vagos","Vieira de Leiria"],
    "Vale de Cambra":["A-dos-Ferreiros","Arões","Cepelos","Codal","Junqueira","Macieira de Cambra","Roge","São Pedro de Castelões","Vale de Cambra"]
  },
  "Beja": {
    "Aljustrel":["Aljustrel","Ervidel","Messejana","Rio de Moinhos","São João de Negrilhos"],
    "Almodôvar":["Almodôvar","Graça dos Padrões","Rosário","Santa Clara-a-Nova","Santa Cruz","São Barnabé","Aldeia dos Fernandes"],
    "Alvito":["Alvito","Vila Nova da Baronia"],
    "Barrancos":["Barrancos"],
    "Beja":["Albernoa","Baleizão","Beja","Beringel","Cabeça Gorda","Mombeja","Nossa Senhora das Neves","Quintos","Salvada","Santa Clara de Louredo","Santa Vitória","Santiago Maior","São Brissos","São João Baptista","Trindade","Trigaches"],
    "Castro Verde":["Castro Verde","Entradas","Santa Bárbara de Padrões","São Marcos da Ataboeira"],
    "Cuba":["Cuba","Figueira de Cavaleiros","Vila Alva","Vila Ruiva"],
    "Ferreira do Alentejo":["Canhestros","Ferreira do Alentejo","Figueira dos Cavaleiros","Odivelas","Peroguarda"],
    "Mértola":["Alcaria Ruiva","Corte do Pinto","Espírito Santo","Mértola","Santana de Cambas","São Miguel do Pinheiro","São Pedro de Solis","São Sebastião dos Carros"],
    "Moura":["Amareleja","Brinches","Póvoa de São Miguel","Safara","Santo Amador","Sobral da Adiça"],
    "Odemira":["Boavista dos Pinheiros","Brejão","Colos","Longueira-Almograve","Luzianes-Gare","Relíquias","Sabóia","Santa Clara-a-Velha","São Luís","São Martinho das Amoreiras","São Teotónio","Vale de Santiago","Vila Nova de Milfontes","Zambujeira do Mar"],
    "Ourique":["Garvão","Ourique","Panóias","Panoias","Santa Luzia","Santana da Serra"],
    "Serpa":["Brinches","Jerómenho","Pias","Salvador","Santa Iria","São Brás dos Matos","Serpa","Vila Verde de Ficalho"],
    "Vidigueira":["Pedrógão","Selmes","Vidigueira","Vila de Frades"]
  },
  "Braga": {
    "Amares":["Amares","Barreiros","Bico","Bouro","Caldelas","Carrazedo","Caires","Dornelas","Figueiredo","Fiscal","Goães","Lago","Paranhos","Paredes Secas","Prozelo","Rendufe","Torre"],
    "Barcelos":["Abade de Neiva","Aldreu","Alheira","Arcozelo","Areias","Balugães","Barcelinhos","Barcelos","Bastuço","Cambeses","Carapeços","Carreira","Chavão","Chorente","Cossourado","Couto","Creixomil","Durrães","Encourados","Fonte Boa","Fragoso","Galegos Santa Maria","Galegos São Martinho","Gil","Gilmonde","Góios","Graças","Grimancelos","Janarde","Lama","Lijó","Manhente","Mariz","Martim","Milhazes","Minhotães","Monte de Fralães","Moure","Negreiros","Oliveira","Palme","Panque","Pereira","Perelhal","Ponte","Portela","Quintiães","Remelhe","Rio Covo Santa Eugénia","Rio Covo Santa Eulália","Roriz","Silva","Silveiros","Tamel São Paio","Tamel Santa Leocádia","Tamel São Pedro Fins","Tregosa","Ucha","Várzea","Vilar de Figos","Vilar do Monte"],
    "Braga":["Braga","Cabreiros","Celeirós","Crespos","Dume","Espinho","Figueiredo","Fraústo","Gualtar","Guimarães","Lamas","Lanhoso","Lamaçães","Maximinos","Merelim","Mire de Tibães","Moreira de Cónegos","Morreira","Nogueiró","Pedralva","Penso Santo Estêvão","Priscos","Real","Ruilhe","Santa Lucrécia de Algeriz","Santa Marta de Portuzelo","São João de Souto","São José de São Lázaro","São Lázaro","São Paio de Arcos","São Pedro de Este","São Victor","Sequeira","Tadim","Tebosa","Uma","Vilaça"],
    "Cabeceiras de Basto":["Abade de Monteiros","Alvite","Arco de Baúlhe","Basto","Bucos","Cabeceiras de Basto","Cavez","Faia","Gondiães","Outeiro","Painzela","Passos","Pedraça","Refojos de Basto","Rigide","São Paio de Aboim","Vilar de Cunhas"],
    "Celorico de Basto":["Arnoia","Borba de Montanha","Britelo","Caçarilhe","Canedo de Basto","Carvalho","Cerdeirinhas","Corgo","Fervença","Molares","Moreira do Castelo","Riodouro","Santa Tecla","Tapada","Veade"],
    "Esposende":["Antas","Apúlia","Belinho","Cristelo","Curvos","Esposende","Fão","Fonte Boa","Gandra","Gemunde","Marinhas","Palmeira de Faro","Rio Tinto","Suão"],
    "Fafe":["Aboim da Nóbrega","Agrela","Antime","Armil","Arvelos","Aveleda","Azevedo","Cepães","Destriz","Espindo","Estorãos","Fareja","Fornelos","Golães","Gontim","Medelo","Monte","Moreira do Rei","Passos","Pedraído","Queimadela","Quinchães","Regadas","Revelhe","Ribeiros","Rossas","Runfe","Serafão","Silvares","Soutelinho da Raia","Travassós","Várzea Cova","Vieira do Minho","Vila Cova"],
    "Guimarães":["Abação","Airão Santa Maria","Airão São João","Aldão","Arosa","Atães","Azurém","Barco","Brito","Caldelas","Candoso Santiago","Candoso São Martinho","Costa","Creixomil","Donim","Fermentões","Figueiredo","Gonça","Gondomar","Guardizela","Guimarães","Infantas","Leitões","Longos","Lordelo","Lordosa","Mascotelos","Mesão Frio","Moreira de Cónegos","Mosteiro","Nespereira","Nicolau","Oliveira do Castelo","Oliveira de São Mateus","Pencelo","Pinheiro","Polvoreira","Ponte","Queimadela","Rendufe","Ronfe","Sande São Clemente","Sande São Lourenço","Sande Vila Nova","Santa Eufémia de Prazins","Santa Eulália de Briteiros","Santo Estêvão de Briteiros","Santo Tirso de Prazins","São Faustino","São João de Ponte","São Lourenço de Sande","São Martinho de Candoso","São Salvador de Briteiros","São Sebastião de Selho","São Torcato","Selho","Silvares","Souto Santa Maria","Souto São Salvador","Vermil","Vila Nova de Sande"],
    "Póvoa de Lanhoso":["Águas Santas","Ajude","Beiral do Lima","Brunhais","Calvos","Carreira","Covide","Esperança","Ferreiros","Garfe","Geraz do Minho","Jordão","Lanhoso","Louredo","Lucrécia","Monsul","Moure","Pinheiro","Póvoa de Lanhoso","Render","Serzedelo","Sirvozelo","Sobradelo da Goma","Taíde","Verim","Vilar do Chão"],
    "Terras de Bouro":["Campo do Gerês","Carvalheira","Chamoim","Chorense","Covide","Gondoriz","Gracíosa","Moimenta","Ribeira","Rio Caldo","Souto","Valdozende","Vilar"],
    "Vieira do Minho":["Agilde","Anissó","Campos","Cantelães","Caniçada","Cerdeirinhas","Confurco","Eira Vedra","Guilhofrei","Mosteiro","Parada do Bouro","Rossas","Ruivães","Salamonde","Soengas","Soutelo","Ventosa","Vieira do Minho","Vila Chã","Vilar Chão"],
    "Vila Nova de Famalicão":["Antas","Arnoso Santa Maria","Arnoso Santa Eulália","Avidos","Calendário","Carreira","Cruz","Delães","Esmeriz","Fradelos","Gavião","Joane","Louro","Mouquim","Nine","Novais","Oliveira Santa Maria","Oliveira São Mateus","Pousada de Saramagos","Ribeirão","Ruivães","São Cosme","São Martinho do Vale","São Paio","Seide São Miguel","Seide São Paio","Telhado","Vermoim","Vila Nova de Famalicão","Vilarinho das Cambas"],
    "Vila Verde":["Arcozelo","Atiães","Barbudo","Cabanelas","Carreiras","Cervães","Coucieiro","Duas Igrejas","Escariz","Esqueiros","Fontes","Goães","Gondomar","Lage","Lanhas","Loureira","Louredo","Lucrécia","Marrancos","Mós","Moure","Oriz Santa Marinha","Oriz São Miguel","Parada de Gatim","Passeiros","Pico de Regalados","Prado","Rio Mau","Roças","Sande","São Caetano","São João Baptista","Soutelo","Turiz","Várzea","Vilarinho Samardã"],
    "Vizela":["Caldas de Vizela","Infias","Novais","São João","São Miguel","Tagilde","Vizela"]
  },
  "Castelo Branco": {
    "Belmonte":["Belmonte","Caria","Inguias","Maçainhas"],
    "Castelo Branco":["Alcains","Almaceda","Benquerenças","Castelo Branco","Cebolais de Cima","Escalos de Baixo","Escalos de Cima","Fatela","Janeiro de Baixo","Juncal do Campo","Lardosa","Lousa","Malpica do Tejo","Monforte da Beira","Ninho do Açor","Póvoa de Rio de Moinhos","Retaxo","Salgueiro do Campo","São Vicente da Beira","Sobral do Campo","Tinalhas"],
    "Covilhã":["Aldeia do Souto","Barco","Boidobra","Cantar-Galo","Canhoso","Casegas","Covilhã","Dominguiso","Erada","Ferro","Orjais","Paul","Peraboa","Peso","São Jorge da Beira","Sobral de São Miguel","Tortosendo","Unhais da Serra","Vale Formoso","Verdelhos","Vila do Carvalho"],
    "Fundão":["Alcaide","Alcaria","Aldeia de Joanes","Aldeia Nova do Cabo","Alpedrinha","Barroca","Bogas de Baixo","Bogas de Cima","Castelejo","Castelo Novo","Cerce","Donas","Enxabarda","Fundão","Janeiro de Cima","Lavacolhos","Mata da Rainha","Orca","Pêro Viseu","Salgueiro","Soalheira","Souto da Casa","Telhado","Valverde","Vale de Prazeres"],
    "Idanha-a-Nova":["Aldeia de Santa Margarida","Idanha-a-Nova","Idanha-a-Velha","Ladoeiro","Medelim","Monfortinho","Monsanto","Oledo","Penha Garcia","Proença-a-Velha","Rosmaninhal","Salvaterra do Extremo","São Miguel d'Acha","Segura","Toulões"],
    "Oleiros":["Álvaro","Cambas","Estreito de Cima","Oleiros","Orvalho","Sarnadas de Ródão","Sarzedas"],
    "Penamacor":["Águas","Aldeia do Bispo","Aldeia Velha","Benquerença","Meimão","Meimoa","Penamacor","Quintas de São Bartolomeu","Salvador","São Bartolomeu"],
    "Proença-a-Nova":["Montes da Senhora","Peral","Proença-a-Nova","Sobreira Formosa","São Pedro do Esteval"],
    "Sertã":["Aldeia de São Francisco de Assis","Cabeçudo","Carvalhal","Castelo","Cernache do Bonjardim","Ermida","Figueiredo","Marmeleiro","Milreu","Moselos","Palhais","Pedrógão Pequeno","Sertã","Troviscal","Várzea dos Cavaleiros"],
    "Vila de Rei":["Fundada","São João do Peso","Vila de Rei"],
    "Vila Velha de Ródão":["Fratel","Perais","Sarzedas de São Pedro","Vila Velha de Ródão"]
  },
  "Coimbra": {
    "Arganil":["Arganil","Benfeita","Cerdeira","Coja","Folques","Moura da Serra","Pomares","Pombeiro da Beira","São Martinho da Cortiça","Secarias","Teixeira","Vila Cova de Alva"],
    "Cantanhede":["Ançã","Bolho","Cadima","Cantanhede","Cordinhã","Covões","Febres","Feteira","Horta","Murtede","Ourentã","Portunhos","Pocariça","Santa Eulália","Santiago de Montemor","Sepins","Vilamar"],
    "Coimbra":["Almalaguês","Assafarge","Eiras","Lamarosa","São Martinho do Bispo","Santo António dos Olivais","Souselas","Torres do Mondego","Trouxemil","Coimbra"],
    "Condeixa-a-Nova":["Anobra","Bem da Fé","Condeixa-a-Nova","Furadouro","Sebal","Vil de Matos"],
    "Figueira da Foz":["Brenha","Buarcos","Lavos","Maiorca","Marinha das Ondas","Moinhos","Paião","Quiaios","São Julião","São Pedro","Tavarede","Alhadas","Vila Verde"],
    "Góis":["Alvares","Cadafaz","Colmeal","Góis","Vila Nova do Ceira"],
    "Lousã":["Figueiró de Lorvão","Lousã","Serpins","Vilarinho"],
    "Mira":["Carapelhos","Mira","Praia de Mira","Seixo"],
    "Miranda do Corvo":["Lamas","Miranda do Corvo","Rio de Vide","Semide","Vila Nova"],
    "Montemor-o-Velho":["Abrunheira","Arazede","Carapichel","Ereira","Gatões","Liceia","Meãs do Campo","Montemor-o-Velho","Pereira","Santo Varão","Seixo","Tentúgal","Vil de Matos"],
    "Oliveira do Hospital":["Bobadela","Ervedal da Beira","Lagares da Beira","Lourosa","Meruge","Nogueira do Cravo","Oliveira do Hospital","Penalva de Alva","Santa Ovaia","São Gião","São Sebastião da Feira","Seixo da Beira","Travanca de Lagos"],
    "Pampilhosa da Serra":["Dornelas do Zêzere","Janeiro de Cima","Machio","Pessegueiro","Pampilhosa da Serra","Portela do Fojo","Unhais da Serra"],
    "Penacova":["Carvalho","Figueira de Lorvão","Lamarosa","Lorvão","Penacova","São Paio de Mondego","Sazes do Lorvão","Travanca do Mondego"],
    "Penela":["Cumieira","Lagos da Beira","Penela","São Miguel","Podentes","Vila Flor"],
    "Soure":["Alfarelos","Degracias","Gesteira","Granja do Ulmeiro","Samuel","Soure","Vinha da Rainha","Vila Nova de Anços"],
    "Tábua":["Candosa","Casal Vasco","Espariz","Midões","Moimenta da Serra","Mouronho","Pinheiro de Coja","Póvoa de Midões","São João da Boa Vista","Tábua"],
    "Vila Nova de Poiares":["Arrifana","San Facundo","Santo André","São Miguel","Vila Nova de Poiares"]
  },
  "Évora": {
    "Alandroal":["Alandroal","Capelins","Juromenha","Santiago Maior","Terena"],
    "Arraiolos":["Arraiolos","Igrejinha","Santa Justa","Sabugueiro","Vimieiro"],
    "Borba":["Borba","Orada","Rio de Moinhos"],
    "Estremoz":["Estremoz","Santa Vitória do Ameixial","São Bento de Ana Loura","São Bento do Cortiço","São Bento do Mato","São Domingos de Ana Loura","São Lourenço de Mamporcão","Veiros"],
    "Évora":["Bacelo","Canaviais","Évora","Malagueira","Nora","Nossa Senhora da Graça do Divor","Nossa Senhora de Machede","São Sebastião da Giesteira","São Manços","Torre de Coelheiros"],
    "Montemor-o-Novo":["Cabrela","Ciborro","Cortiçadas de Lavre","Foros de Vale de Figueira","Lavre","Montemor-o-Novo","Nossa Senhora do Bispo","Santiago do Escoural","Silveiras"],
    "Mora":["Cabeção","Mora","Pavia","Brotas"],
    "Mourão":["Granja","Mourão","Luz"],
    "Portel":["Amieira","Campinho","Monte do Trigo","Oriola","Portel","Santana"],
    "Redondo":["Montoito","Redondo"],
    "Reguengos de Monsaraz":["Campo","Campinho","Corval","Monsaraz","Reguengos de Monsaraz"],
    "Vendas Novas":["Landeira","Vendas Novas"],
    "Viana do Alentejo":["Aguiar","Alcáçovas","Viana do Alentejo"],
    "Vila Viçosa":["Bencatel","Ciladas","Pardais","Vila Viçosa"]
  },
  "Faro": {
    "Albufeira":["Albufeira","Ferreiras","Guia","Paderne","Olhos de Água"],
    "Alcoutim":["Alcoutim","Giões","Martim Longo","Pereiro","Vaqueiros"],
    "Aljezur":["Aljezur","Bordeira","Odeceixe","Rogil"],
    "Castro Marim":["Altura","Azinhal","Castro Marim","Odeleite"],
    "Faro":["Conceição e Estoi","Faro","Montenegro","Santa Bárbara de Nexe","São Pedro","Sé"],
    "Lagoa":["Carvoeiro","Estômbar","Ferragudo","Lagoa","Porches","Parchal"],
    "Lagos":["Bensafrim","Barão de São João","Lagos","Luz","Odiáxere"],
    "Loulé":["Almancil","Alte","Ameixial","Benafim","Boliqueime","Loulé","Quarteira","Querença","Salir","São Clemente","São Sebastião","Tôr"],
    "Monchique":["Alferce","Marmelete","Monchique"],
    "Olhão":["Fuseta","Moncarapacho","Olhão","Pechão","Quelfes","Tavira"],
    "Portimão":["Alvor","Mexilhoeira Grande","Portimão"],
    "São Brás de Alportel":["São Brás de Alportel"],
    "Silves":["Alcantarilha","Algoz","Armação de Pêra","Silves","São Bartolomeu de Messines","São Marcos da Serra","Tunes"],
    "Tavira":["Cachopo","Conceição","Luz de Tavira","Pedras d'El Rei","Santa Catarina da Fonte do Bispo","Santa Luzia","Santo Estêvão","Tavira"],
    "Vila do Bispo":["Budens","Raposeira","Sagres","Vila do Bispo"],
    "Vila Real de Santo António":["Monte Gordo","Vila Nova de Cacela","Vila Real de Santo António"]
  },
  "Guarda": {
    "Aguiar da Beira":["Aguiar da Beira","Carapito","Cortiçada","Eirado","Forninhos","Grande","Lamegal","Penas Roias","Preserves","Sequeiros","Souto de Aguiar da Beira"],
    "Almeida":["Almeida","Amoreira","Castelo Bom","Castelo Mendo","Freineda","Leomil","Malhada Sorda","Mesquitela","Mileu","Naves","Peva","Porto de Ovelha","Senouras","Vale da Mula","Vilar Formoso","Vilares"],
    "Celorico da Beira":["Açores","Aldeia do Bispo","Baraçal","Carvalhal Meão","Casas do Soeiro","Casal de Cinza","Celorico da Beira","Cortiçô da Serra","Forno Telheiro","Lageosa do Mondego","Lajeosa do Mondego","Maçal do Chão","Minhocal","Prados","Ratoeira","Salgueirais","São Paio","Valhelhas","Vela"],
    "Figueira de Castelo Rodrigo":["Almofala","Castelo Rodrigo","Escarigo","Figueira de Castelo Rodrigo","Freixeda do Torrão","Mata de Lobos","Numão","Paradinha","Reigada","Touça"],
    "Fornos de Algodres":["Algodres","Corujeira","Fornos de Algodres","Fuinhas","Maceira","Matança","Muxagata","Queiriz","Sobral Pichorro","Vila Chã","Vila Ruiva"],
    "Gouveia":["Aldeias","Arcozelo da Serra","Cativelos","Figueiró da Serra","Folgosinho","Gouveia","Lagarinhos","Melo","Moimenta da Serra","Nabais","Paços da Serra","Rio Torto","São Julião","Vila Cortês da Serra","Vila Nova de Tazem","Vinhó"],
    "Guarda":["Adão","Aldeia do Souto","Aldeia Viçosa","Alvendre","Arrifana","Avelãs da Ribeira","Avelãs de Ambom","Benespera","Casal de Cinza","Castanheira","Codesseiro","Corujeira","Faia","Famalicão","Fernão Joanes","Gaiteiros","Gonçalo","Gonçalo Bocas","Guarda","João Antão","Maçainhas","Marmeleiro","Meios","Monte Margarida","Panoias de Cima","Pega","Porto da Carne","Ramela","Ribamondego","São Miguel da Guarda","São Vicente","Sé","Sobral da Serra","Trinta","Vale de Amoreira","Valhelhas","Vela","Vila Cortês do Mondego","Vila Fernando","Vila Franca do Deão","Vila Garcia","Vilar Torpim","Vitozelos"],
    "Manteigas":["Manteigas","Sameiro","Vale de Amoreira"],
    "Meda":["Casteição","Coriscada","Fonte Longa","Longroiva","Marialva","Meda","Outeiro de Gatos","Pai Penela","Poço do Canto","Prova","Rabaçal"],
    "Pinhel":["Ade","Alverca da Beira","Bogalhão","Ervas Tenras","Freixedas","Lameiras","Manigoto","Pala","Pinhel","Pínzio","Pousafoles do Bispo","Safurdão","Santa Eufémia","São Cristóvão","Souro Pires","Valbom","Vermosa","Vila do Touro","Vilar de Amargo"],
    "Sabugal":["Aldeia da Ribeira","Aldeia do Bispo","Aldeia Velha","Alfaiates","Baraçal","Bendada","Bismula","Caria","Casteleiro","Castelo","Cinco Vilas","Foios","Lajeosa do Côa","Lomba","Malcata","Moita","Nave","Ozendo","Pena Lobo","Quadrazais","Rapoula do Côa","Rendo","Ruivós","Sabugal","Seixo do Côa","Soito","Vale das Éguas","Vilar Maior","Vilar Torpim","Vilas Boas"],
    "Seia":["Seia","São Romão","Santa Comba","Alvoco da Serra","Sabugueiro","Carragozela","Travancinha","Loriga","Paranhos da Beira","Santo Antão"],
    "Trancoso":["Aldeia Nova","Carnicães","Caria","Castanheira","Cogula","Feital","Fiães","Moreira de Rei","Palhais","Póvoa do Concelho","Reboleiro","Rio de Mel","Salgueiral","Sernancelhe","Torre do Terranho","Trancoso","Valdujo","Vale do Seixo","Vila Garcia","Vila Moreira"],
    "Vila Nova de Foz Côa":["Almendra","Castelo Melhor","Cedovim","Chãs","Custóias","Freixo de Numão","Horta","Muxagata","Numão","Santa Comba","Vila Nova de Foz Côa","Touça","Urros","Vale de Figueira","Ventozelo","Vila do Touro"]
  },
  "Leiria": {
    "Alcobaça":["Alcobaça","Alfeizerão","Aljubarrota","Alpedriz","Benedita","Bárrio","Cela","Coz","Évora de Alcobaça","Maiorga","Martingança","Montes","Pataias","Póvoa das Meadas","Prazeres de Aljubarrota","Reguengo Grande","Salir de Matos","Serra de El-Rei","Souto da Carpalhosa","Turquel","Vestiaria","Vidais","Vieira de Leiria"],
    "Ansião":["Ansião","Chão de Couce","Cortes","Lima de Frades","Avelar","Poussos","Lagarteira"],
    "Batalha":["Batalha","Golpilheira","Nossa Senhora do Roque","São Mamede"],
    "Bombarral":["Bombarral","Carvalhal","Roliça","Vale Óbidos"],
    "Caldas da Rainha":["Água Quente","Alvorniça","Bombarral","Caldas da Rainha","Carvalhal Benfeito","Coz","Foz do Arelho","Landal","Nadadouro","Óbidos","Pinheiro","Ramalhete","Salir de Matos","Santa Catarina","Serra do Bouro","Tornada","Vidais"],
    "Castanheira de Pêra":["Castanheira de Pêra","Coentral"],
    "Figueiró dos Vinhos":["Arega","Benagouro","Campelo","Figueiró dos Vinhos"],
    "Leiria":["Amor","Arrabal","Azoia","Barosa","Barreiros","Bidoeira de Cima","Caranguejeira","Coimbrão","Colmeias","Cortes","Leiria","Maceira","Marrazes","Monte Real","Monte Redondo","Ortigosa","Parceiros","Pousos","Regueira de Pontes","Santa Catarina da Serra","Santa Eufémia","São Romão de Neiva","Souto da Carpalhosa","Tomar"],
    "Marinha Grande":["Marinha Grande","Moita","Vieira de Leiria"],
    "Nazaré":["Famalicão","Nazaré","Valado dos Frades"],
    "Óbidos":["A-dos-Negros","Amoreira","Gaeiras","Olho Marinho","Óbidos","Santa Maria","São Pedro","Sobral da Lagoa","Usseira","Vau"],
    "Pedrógão Grande":["Graça","Figueiró dos Vinhos","Pedrógão Grande","Pedrógão Pequeno"],
    "Peniche":["Atouguia da Baleia","Ferrel","Peniche","Serra d'El-Rei"],
    "Pombal":["Abiul","Albergaria dos Doze","Almagreira","Avelar","Carriço","Carnide","Guia","Ilha","Louriçal","Meirinhas","Pelariga","Pombal","Queluz de Baixo","Santiago de Litém","Vermoil","Vila Cã"],
    "Porto de Mós":["Alcanena","Alcaria","Alvados","Arrimal","Calvaria de Cima","Casal Velho","Calvaria","Juncal","Porto de Mós","Serro Ventoso","São João Baptista","São Pedro Fins","Valverde","Vela"],
    "Caldas da Rainha":[]
  },
  "Lisboa": {
    "Alenquer":["Abrigada","Aldeia Galega da Merceana","Aldeia Gavinha","Alenquer","Cabanas de Torres","Carnota","Catanheira","Olhalvo","Ota","Pereiro de Palhacana","Ribafria","Santo Estêvão","Triana","Ventosa","Vila Verde dos Francos"],
    "Amadora":["Alfragide","Brandoa","Buraca","Damaia","Falagueira","Mina de Água","Reboleira","Venteira"],
    "Arruda dos Vinhos":["Arranhó","Arruda dos Vinhos","Cardosas","Santiago dos Velhos"],
    "Azambuja":["Alcoentre","Aveiras de Baixo","Aveiras de Cima","Azambuja","Manique do Intendente","Vale do Paraíso","Vilanova da Rainha"],
    "Cadaval":["Alguber","Cadaval","Cercal","Figueiros","Lamas","Peral","Pêro Moniz","Vilar","Vermelha"],
    "Cascais":["Alcabideche","Cascais e Estoril","Parede","São Domingos de Rana"],
    "Lisboa":["Ajuda","Alcântara","Areeiro","Arroios","Avenidas Novas","Beato","Belém","Benfica","Campo de Ourique","Campolide","Carnide","Estrela","Lumiar","Marvila","Misericórdia","Olivais","Parque das Nações","Penha de França","Santa Clara","Santa Maria Maior","Santo António","São Domingos de Benfica","São Vicente"],
    "Loures":["Bucelas","Camarate","Fanhões","Loures","Lousa","Moscavide e Portela","Prior Velho","Santa Iria de Azoia","Santo Antão do Tojal","Santo António dos Cavaleiros","São João da Talha","São Julião do Tojal"],
    "Lourinhã":["Ah","Atalaia","Lourinhã","Moledo","Miragalhos","Reguengo Grande","Ribamar","Santa Bárbara"],
    "Mafra":["Azueira","Carvoeira","Cheleiros","Encarnação","Enxara do Bispo","Ericeira","Igreja Nova","Malveira","Mafra","Milharado","Santo Estêvão das Galés","Santo Isidoro","São Miguel de Alcainça","Venda do Pinheiro"],
    "Odivelas":["Caneças","Famões","Odivelas","Olival Basto","Pontinha","Póvoa de Santo Adrião","Ramada"],
    "Oeiras":["Algés","Barcarena","Cruz Quebrada-Dafundo","Linda-a-Velha","Oeiras e São Julião da Barra","Paço de Arcos","Porto Salvo"],
    "Sintra":["Agualva e Mira-Sintra","Algueirão-Mem Martins","Casal de Cambra","Colares","Massamá","Montelavar","Pêro Pinheiro","Queluz e Belas","Rio de Mouro","São João das Lampas e Terrugem","São Marcos","Sintra"],
    "Sobral de Monte Agraço":["Aber","Sapataria","Sobral de Monte Agraço"],
    "Torres Vedras":["A dos Cunhados","Campelos","Carvoeira","Dois Portos","Freiria","Matacães","Outeiro da Cabeça","Ponte do Rol","Ramalhal","Santa Maria e São Miguel","São Pedro da Cadeira","Silveira","Torres Vedras","Turcifal","Ventosa"],
    "Vila Franca de Xira":["Alhandra","Alverca do Ribatejo","Arcena","Calhandriz","Castanheira do Ribatejo","Forte da Casa","Póvoa de Santa Iria","Vialonga","Vila Franca de Xira"]
  },
  "Portalegre": {
    "Alter do Chão":["Alter do Chão","Cabeço de Vide","Chança","Seda"],
    "Arronches":["Arronches","Assunção","Esperança"],
    "Avis":["Alcôrrego","Avis","Benavila","Ervedal","Figueira e Barros","Maranhão","São Bento de Ana Loura"],
    "Campo Maior":["Campo Maior","Nossa Senhora da Expectação","Nossa Senhora de Guadalupe","São João Baptista"],
    "Castelo de Vide":["Castelo de Vide","Nossa Senhora da Graça","Santa Maria","Santiago Maior","São João Baptista"],
    "Crato":["Aldeia da Mata","Crato","Flor da Rosa","Gáfete","Monte da Pedra","Vale do Peso"],
    "Elvas":["Alcáçovas","Assunção","Barbacena","Caia e São Pedro","Elvas","Santa Eulália","São Brás e São Lourenço","São Vicente e Ventosa","Terrugem","Vila Boim","Vila Fernando"],
    "Fronteira":["Cabeço de Vide","Fronteira","São Saturnino"],
    "Gavião":["Belver","Comenda","Gavião","Margem"],
    "Marvão":["Beirã","Marvão","Santo António das Areias","São Salvador de Aramenha"],
    "Monforte":["Assumar","Monforte","Mosteiros","Vaiamonte"],
    "Nisa":["Alpalhão","Amieira do Tejo","Arez","Carneiros","Montalvão","Nisa","São Matias","Tolosa"],
    "Ponte de Sor":["Foros de Arrão","Galveias","Longomel","Montargil","Ponte de Sor","São Bento Ameixial"],
    "Portalegre":["Alagoa","Alegrete","Fortios","Ribeira de Nisa","São Julião","Sé","Urra"]
  },
  "Porto": {
    "Amarante":["Aboadela","Aboim","Amarante","Ansiães","Candemil","Cepelos","Figueiró","Frigaças","Gondar","Gouveia","Jazente","Lixa","Lomba","Louredo","Lufrei","Mancelos","Oliveira","Padronelo","Real","Rebordelo","Salvador do Monte","Telões","Travanca","Vila Caiz","Vila Chã","Vila Meã","Vila Boa de Quires"],
    "Baião":["Ancede","Baião","Campelo","Covelas","Frende","Gove","Grilo","Lomba","Loivos da Ribeira","Loivos do Monte","Mesquinhata","Ovil","Santa Cruz do Douro","São Tomé de Covelas","Teixeira","Teixeiró","Tresouras","Valadares","Viariz"],
    "Felgueiras":["Airães","Borba de Godim","Caramos","Covas","Friande","Idães","Jugueiros","Lagares","Margaride","Moure","Pedreira","Pinheiro","Piães","Rande","Regilde","Revinhade","Santão","Sousa","Torrados","Unhão","Varziela","Veade","Sendim"],
    "Gondomar":["Baguim do Monte","Covelo","Fânzeres","Foz do Sousa","Gondomar","Jovim","Lomba","Melres","Rio Tinto","São Cosme","São Pedro da Cova","Valbom"],
    "Lousada":["Aveleda","Boim","Casais","Cristelos","Esperança","Figueiras","Lodares","Lousada","Lustosa","Meinedo","Nespereira","Nogueira","Ordem","Silvares","Torno","Vilar do Torno e Alentém"],
    "Maia":["Águas Santas","Avioso Santa Maria","Avioso São Pedro","Barca","Castêlo da Maia","Folgosa","Gemunde","Gueifães","Maia","Milheirós","Moreira","Nogueira","Pedrouços","São Pedro de Fins","Silva Escura","Vermoim","Vila Nova da Telha"],
    "Marco de Canavezes":["Alpendorada e Matos","Avessadas","Banho e Carvalhosa","Constance","Favões","Figueira","Folhada","Fornos","Larim","Magrelos","Manhuncelos","Marco de Canavezes","Maureles","Paredes de Viadores","Penha Longa","Rosém","São Lourenço do Douro","Soalhães","Sobretâmega","Tabuado","Torrão","Toutosa","Várzea"],
    "Matosinhos":["Custóias","Lavra","Leça da Palmeira","Leça do Balio","Matosinhos","Perafita","São Mamede de Infesta","Senhora da Hora"],
    "Paços de Ferreira":["Carvalhosa","Eiriz","Ferreira","Figueiró","Frazão","Freamunde","Justino","Meixomil","Modivas","Paços de Ferreira","Penamaior","Raimonda","Sanfins","Serafão","Seroa","Vila Cova"],
    "Paredes":["Astromil","Baltar","Beire","Besteiros","Bitarães","Castelões","Cête","Cristelos","Duas Igrejas","Gondalães","Gandra","Lordelo","Louredo","Mouriz","Parada de Todeia","Paredes","Rebordosa","Recarei","Sobreira","Sobrosa","Vandoma","Vilela"],
    "Penafiel":["Abragão","Alheira","Bustelo","Canelas","Cabeça Santa","Capela","Castelões","Croca","Duas Igrejas","Fonte Arcada","Galegos Santa Maria","Galegos São Martinho","Guilhufe","Irivo","Lagares","Luzim","Marco","Oldrões","Paço de Sousa","Penafiel","Perozelo","Quintão","Rams","Rio de Moinhos","Sebolido","Termas de São Vicente","Vale de Figueira","Valpedre","Viana do Castelo","Vila Boa do Bispo","Vila Cova de Carros","Vila Fria"],
    "Porto":["Aldoar","Bonfim","Campanhã","Cedofeita","Lordelo do Ouro","Massarelos","Miragaia","Paranhos","Ramalde","Santo Ildefonso","São Nicolau","Sé","Vitória"],
    "Póvoa de Varzim":["Aguçadoura","Amorim","Argivai","Balazar","Beiriz","Estela","Laundos","Póvoa de Varzim","Rates","Terroso"],
    "Santo Tirso":["Agrela","Água Longa","Burgães","Couto","Covelas","Guimarei","Lamelas","Lousado","Monte Córdova","Negrelos","Rebordões","Reguenga","Roriz","Santo Tirso","São Mamede de Negrelos","São Martinho do Campo","São Salvador do Campo","São Tomé de Negrelos","Sequeiró","Vilarinho"],
    "Trofa":["Alvarelhos","Bougado","Covelas","Guidões","Muro","São Romão do Coronado","Trofa"],
    "Valongo":["Alfena","Campo","Ermesinde","Sobrado","Valongo"],
    "Vila do Conde":["Arcos","Árvore","Azurara","Bagunte","Canidelo","Fajozes","Fornelo","Frutuoso","Gião","Guilhabreu","Junqueira","Labruge","Macieira da Maia","Mindelo","Modivas","Mosteiró","Navais","Retorta","Rio Mau","Tougues","Touguinhó","Varziela","Vairão","Vilar","Vilar de Pinheiro","Vila Chã","Vila do Conde","Vilar","Vilarinho","Vilar de Pinheiro"],
    "Vila Nova de Gaia":["Arcozelo","Avintes","Canidelo","Canelas","Grijó","Gulpilhares","Lever","Madalena","Mafamude","Olival","Oliveira do Douro","Pedroso","Perozinho","Sandim","Santa Marinha","São Félix da Marinha","Seixezelo","Sermonde","Serzedo","Valadares","Vilar de Andorinho","Vilar do Paraíso","Vilar de Mouros","Gaia"]
  },
  "Santarém": {
    "Abrantes":["Abrantes","Alferrarede","Fontes","Martinchel","Mouriscas","Pego","Rio de Moinhos","Rossio ao Sul do Tejo","São Facundo","São Miguel do Rio Torto","Tramagal","Vale das Mós"],
    "Alcanena":["Alcanena","Bugalhos","Louriceira","Minde","Moitas Venda","Monsanto","Serra de Santo António","Vila Moreira"],
    "Almeirim":["Almeirim","Benfica do Ribatejo","Fazendas de Almeirim","Raposa"],
    "Alpiarça":["Alpiarça"],
    "Benavente":["Barrosa","Benavente","Samora Correia","Santo Estêvão"],
    "Cartaxo":["Cartaxo","Ereira","Lapa","Pontével","Vale da Pedra","Valada","Vila Chã de Outeiro"],
    "Chamusca":["Carriches","Chamusca","Chouto","Pinheiro Grande","Parreira","Ulme","Vale de Cavalos"],
    "Constância":["Constância","Montalvo","Santa Margarida da Coutada"],
    "Coruche":["Biscainho","Couço","Coruche","Fajarda","Lamarosa","Erra","São José da Lamarosa","Santana do Mato"],
    "Entroncamento":["Entroncamento"],
    "Ferreira do Zêzere":["Bicos","Chãos","Ferreira do Zêzere","Igreja Nova do Sobral","Pias","São João de Areias"],
    "Golegã":["Azinhaga","Golegã"],
    "Mação":["Cardigos","Envendos","Mação","Ortiga","Penhascoso"],
    "Rio Maior":["Achete","Alcobertas","Arrouquelas","Assentiz","Azambujeira","Fráguas","Malaqueijo","Outeiro de Palames","Rio Maior","São João da Ribeira","São Sebastião","Spínola","Torres"],
    "Salvaterra de Magos":["Foros de Salvaterra","Glória do Ribatejo","Marinhais","Muge","Salvaterra de Magos","Granho"],
    "Santarém":["Abitureiras","Alcanede","Almoster","Amiais de Baixo","Azoia de Baixo","Azoia de Cima","Casével","Gançaria","Moçarria","Pernes","Póvoa de Santarém","Romeira","Santa Iria da Ribeira de Santarém","Santarém","São Nicolau","São Salvador","São Vicente do Paul","Vale de Figueira","Vaqueiros","Várzea"],
    "Sardoal":["Alcaravela","Moçarria","Pias","Sardoal"],
    "Tomar":["Além da Ribeira","Asseiceira","Beselga","Carregueiros","Casais","Madalena","Olalhas","Paialvo","Serra","Tomar"],
    "Torres Novas":["Alcorochel","Assentiz","Brogueira","Chancelaria","Lapas","Meia Via","Olival","Parceiros de Igreja","Pedrógão","Riachos","Torres Novas","Zibreira"],
    "Vila Nova da Barquinha":["Atalaia","Praia do Ribatejo","Tancos","Vila Nova da Barquinha"],
    "Ourém":["Atouguia","Caxarias","Espite","Fátima","Gondemaria","Matas","Nosseiros","Olival","Ourém","Ribeira do Fárrio","Rio de Couros","Seiça","Urqueira","Vilar dos Prazeres"]
  },
  "Setúbal": {
    "Alcácer do Sal":["Alcácer do Sal","Comporta","Santa Maria do Castelo e Santiago","São Martinho"],
    "Alcochete":["Alcochete","Samouco","São Francisco"],
    "Almada":["Almada","Cacilhas","Caparica","Costa de Caparica","Cova da Piedade","Feijó","Laranjeiro","Pragal","Sobreda","Trafaria"],
    "Barreiro":["Alto do Seixalinho","Barreiro","Coina","Lavradio","Palhais","Santo André","Santo António da Charneca","Verderena"],
    "Grândola":["Azinheira dos Barros e São Mamede do Sadão","Carvalhal","Grândola","Melides","Santiago do Cacém"],
    "Moita":["Alhos Vedros","Baixa da Banheira","Gaio-Rosário","Moita","Vale da Amoreira"],
    "Montijo":["Atalaia","Canha","Montijo","Pegões","Santo Isidro de Pegões"],
    "Palmela":["Palmela","Pinhal Novo","Quinta do Anjo","Setúbal"],
    "Santiago do Cacém":["Abela","Alvalade","Cercal do Alentejo","Ermidas do Sado","Lousal","Saivões","Santa Cruz","Santiago do Cacém","São Bartolomeu da Serra","São Francisco de Assis","São Domingos","Vale de Água"],
    "Seixal":["Aldeia de Paio Pires","Amora","Arrentela","Corroios","Fernão Ferro","Seixal"],
    "Sesimbra":["Castelo","Santiago","Sesimbra","Quinta do Conde"],
    "Setúbal":["Azeitão","Gâmbia-Pontes-Alto da Guerra","Palmela","São Lourenço","São Simão","Setúbal","Sado","Troia"],
    "Sines":["Porto Covo","Sines","São Luís"]
  },
  "Viana do Castelo": {
    "Arcos de Valdevez":["Arcos de Valdevez","Ázere","Cabreiro","Carralcova","Cendufe","Couto","Courel","Duas Igrejas","Gavieira","Giela","Grade","Jolda","Miranda","Monte Redondo","Padreiro","Prozelo","Rio Cabrão","Sabadim","Santar","São Jorge","São Paio","Távora","Vilela"],
    "Caminha":["Âncora","Caminha","Cristelo","Dem","Gondar","Lanhelas","Moledo","Orbacém","Riba de Âncora","Seixas","Venade","Vilarelho","Vila Praia de Âncora"],
    "Melgaço":["Castro Laboreiro","Cousso","Cristoval","Fiães","Gave","Lamas de Mouro","Melgaço","Paderne","Paços","Prado","Remoães","Roussas","Vila"],
    "Monção":["Anhões","Barbeita","Barroças e Taias","Bausende","Ceivães","Cortes","Cristóval","Lapela","Longos Vales","Luzio","Mazedo","Messegães","Merufe","Monção","Moreira","Pias","Pinheiros","Podame","Portela","Queijada","Riba de Mouro","Sá","Segude","Tangil","Troviscoso","Trute","Valadares","Vera Cruz"],
    "Paredes de Coura":["Bico","Castanheira","Coura","Cristoval","Cunha","Ferreira","Formariz","Insalde","Linhares","Mozelos","Padornelo","Parada","Paredes de Coura","Porreiras","Resende","Rubiães","São Martinho de Coura","Vascões"],
    "Ponte da Barca":["Boivães","Britelo","Crasto","Cuide","Entre Ambos os Rios","Ermida","Germil","Lavradas","Nogueira","Padroso","Ruivos","São João de Campo","São Martinho de Crasto","Touvedo","Travassos","Vade","Vila Chã","Vila Nova de Muía"],
    "Ponte de Lima":["Anais","Arcozelo","Ardegão","Arões","Bertiandos","Boalhosa","Brandara","Brante","Cabaços","Cabração","Calvelo","Calheiros","Cerdal","Correlhã","Facha","Faria","Fojo Lobal","Fontão","Fornelos","Friastelas","Gemieira","Gondufe","Gueral","Labrujó","Labruja","Largo","Luzio","Mato","Moreira do Lima","Navió","Poiares","Ponte de Lima","Queijada","Rebordões","Refoidos","Rendufe","Ribeira","Riba de Âncora","Sandiães","Santa Cruz do Lima","São Martinho da Gandra","São Martinho de Matos","São Pedro de Arcos","São Pedro d'Obra","São Pedro de Torre","Seara","Serdedelo","Souto Maior","Vitorino das Donas","Vitorino de Piães"],
    "Valença":["Boivão","Cerdal","Cristelo Covo","Fontoura","Gandra","Ganfei","Gondomil","Options","São Pedro da Torre","São Julião","Taião","Valença","Verdoejo"],
    "Viana do Castelo":["Afife","Alvarães","Amonde","Anha","Areosa","Barroselas","Cardielos","Carreço","Chafé","Darque","Deão","Deocriste","Freixieiro de Soutelo","Geraz do Lima","Lanheses","Meixedo","Meadela","Monserrate","Moreira de Geraz do Lima","Nogueira","Outeiro","Perre","Santa Marta de Portuzelo","Serreleis","Subportela","Viana do Castelo","Vila de Punhe","Vila Fria","Vila Mou"],
    "Vila Nova de Cerveira":["Campos","Candemil","Cornes","Covas","Gondar","Loivo","Mentrestido","Nogueira","Reboreda","Sapardos","Sopo","Vila Meã","Vila Nova de Cerveira"]
  },
  "Vila Real": {
    "Alijó":["Alijó","Carlão","Casal de Loivos","Cotas","Favaios","Pegarinhos","Pópulo","Sanfins do Douro","Santa Eugénia","Vilar de Maçada","Vilarinho de Cotas","Vila Pouca do Aguiar","Ribalonga"],
    "Boticas":["Alturas do Barroso","Ardãos","Beça","Bobadela","Boticas","Codessoso","Curros","Dornelas","Fiães do Tâmega","Granja","Pinho","Rio de Fornos","Sapiãos","Vilar"],
    "Chaves":["Anelhe","Arcossó","Bustelo","Calvão","Cela","Curalha","Decermilo","Eiras","Ervededo","Faiões","Lama de Arcos","Loivos","Madalena","Mairos","Meixedo","Moreiras","Nogueira da Montanha","Outeiro Seco","Oura","Plácido","Póvoa de Agrações","Redondelo","Sanfins","Santa Cruz","Santo Estêvão","São Julião de Montenegro","São Pedro de Agostém","Selhariz","Seara Velha","Soutelinho da Raia","Soutelo","Travancas","Tresminas","Vidago","Vilar de Nantes","Vilarelho da Raia","Vila Verde da Raia","Calvão","Chaves"],
    "Mesão Frio":["Cidadelhe","Mesão Frio","Oliveira","Passos","Vila Marim"],
    "Mondim de Basto":["Atei","Bilhó","Campanhó","Ermelo","Mondim de Basto","Paradança","Vilar de Ferreiros"],
    "Montalegre":["Cabril","Cervos","Covelães","Curros","Donões","Fiães do Rio","Meixide","Montalegre","Morgade","Negrões","Outeiro","Padroso","Pitões das Júnias","Pondras","Salto","Sarraquinhos","Sezelhe","Solveira","Tourém","Vilar de Perdizes","Vilarinho das Furnas"],
    "Murça":["Carva","Fiolhoso","Jou","Murça","Noura","Palheiros","Vilares"],
    "Peso da Régua":["Anta","Britiande","Covelinhas","Fontelas","Galafura","Loureiro","Moura Morta","Peso da Régua","Poiares","Santa Marta de Penaguião","Sedielos"],
    "Ribeira de Pena":["Alvadia","Canedo","Cerva","Limões","Ribeira de Pena","Salvador"],
    "Sabrosa":["Celeirós do Douro","Covas do Douro","Gouvinhas","Parada de Pinhão","Paradela de Guiães","Sabrosa","São Cristóvão do Douro","Souto Maior","Torre do Pinhão","Vale de Mendiz","Vilarinho de São Romão"],
    "Santa Marta de Penaguião":["Cumieira","Fontes","Louredo","Santa Marta de Penaguião","Sever","Soalhães"],
    "Valpaços":["Água Revés e Crasto","Algeriz","Argeriz","Bouçoães","Canaveses","Carrazedo de Montenegro","Curros","Ervões","Fiães","Fornos do Pinhal","Friões","Lebução","Loivos","Nozelos","Padrela e Tazém","Possacos","Rabal","Rio Torto","Santa Maria de Émeres","Santa Valha","São João da Corveira","Valpaços","Vassal","Veiga de Lila","Vinheiros"],
    "Vila Pouca de Aguiar":["Álvaro","Bragado","Capeludos","Fortunho","Parada de Monteiros","Pedras Salgadas","Pensalvos","Soutelo de Aguiar","Telões","Tresminas","Valoura","Veiga de Lila","Vila Pouca de Aguiar"],
    "Vila Real":["Abaças","Andrães","Arroios","Borbela","Campeã","Cervos","Constança","Constantim","Folhadela","Guiães","Lamas de Olo","Lordelo","Mateus","Mouçós","Murça","Nogueira","Parada de Cunhos","Quintã","São Miguel","São Tomé do Castelo","Torgueda","Vale","Vila Marim","Vila Real"]
  },
  "Viseu": {
    "Armamar":["Armamar","Cimbres","Folgosa","Goujoim","Queimada","Queimadela","Santa Cruz","São Cosmado","São Martinho das Chãs","Vacalar","Vila Seca"],
    "Carregal do Sal":["Beselga","Cabanas de Viriato","Caldas de Canas","Carregal do Sal","Parada","Oliveira do Conde","Santa Comba Dão","São João da Serra"],
    "Castro Daire":["Almofei","Aregos","Ázere","Baltar","Cabril","Castro Daire","Cujó","Ermida","Gosende","Moledo","Monteiras","Moura Morta","Parada de Ester","Pepim","Picão","Reriz","Ribolhos","São Martinho de Mouros","Vale deÁguas"],
    "Cinfães":["Alhões","Bustelo","Cinfães","Espadanedo","Ferreiros de Tendais","Fornelos","Gralheira","Moimenta","Nespereira","Oliveira do Douro","Santiago de Piães","São Cristóvão de Nogueira","Souselo","Tarouquela","Travanca","Vil de Moinhos"],
    "Lamego":["Almacave","Britiande","Cambres","Cepões","Ferreiros de Avões","Figueira","Lalim","Lamego","Lazarim","Lid","Meijinhos","Melcões","Paços","Penajóia","Penude","Peso","Régua","Samodães","Sande","Valdigem","Várzea de Abrunhais","Bigorne"],
    "Mangualde":["Abrunhosa a Velha","Alcafache","Cunha Alta","Cunha Baixa","Espinho","Fornos de Maceira Dão","Freixiosa","Mangualde","Mesquitela","Orgens","Quintela de Azurara","São João da Fresta","Tavares"],
    "Moimenta da Beira":["Aldeia de Nacomba","Arcossó","Baldos","Cabaços","Caria","Castelo","Dorna","Igrejinha","Leomil","Moimenta da Beira","Nagosa","Peva","Pias","Rio de Mouro","Sarzedo","Sever","Vilar","Vilar de Murteda"],
    "Mortágua":["Espinho","Mortágua","Pala","Pinheiro","Serra de São Domingos","Sobral","Trezói","Velosa"],
    "Nelas":["Canas de Senhorim","Carvalhal Redondo","Lapa do Lobo","Nelas","Senhorim","Vilar Seco"],
    "Oliveira de Frades":["Arcozelo das Maias","Destriz","Eiras","Fairão","Fráguas","Oliveira de Frades","Pinheiro","Reigoso","São João da Serra","São Vicente de Lafões","Sejães","Souto de Lafões","Varzielas"],
    "Penalva do Castelo":["Castainço","Ester","Lusinde","Matela","Meã","Pindo","Penalva do Castelo","Porção","Sendim","Urrós"],
    "Penedono":["Antas","Castainço","Dornas","Granja","Penedono","Póvoa de Penela","Queimada","Souto"],
    "Resende":["Barrô","Cárquere","Felgueiras","Figueira","Freigil","Paus","Resende","São Cipriano","São João de Fontoura","São Martinho de Mouros","Várzea"],
    "Santa Comba Dão":["Óvoa","Parada de Gonta","Santa Comba Dão","Treixedo","Vimieiro"],
    "São João da Pesqueira":["Castanheiro do Sul","Ervedosa do Douro","Espinhosa","Nagozelo do Douro","Paredes da Beira","Riodades","São João da Pesqueira","Soutelo do Douro","Trevões","Vale de Figueira","Valença do Douro","Vilarouco"],
    "São Pedro do Sul":["Covas do Rio","Covo de Beira","Figueiredo de Alva","Lamas","Lima Ceira","Manhouce","Pindelo dos Milagres","Pinho","Santa Cruz da Trapa","Santo André de Vendas Novas","São Félix","São Martinho das Moitas","São Pedro do Sul","Serrazes","Sul","Valadares","Vale de Cambra"],
    "Sátão":["Avelal","Decermilo","Esperança","Mioma","Monte","Romãs","São Miguel de Vila Boa","Sátão","Silvã de Cima","Souto","Vila Longa"],
    "Sernancelhe":["Aldeia de Nacomba","Arnas","Chosendo","Cunha","Escurquela","Faia","Ferreirim","Fonte Arcada","Granja","Lamosa","Lavegadas","Longa","Modelos","Sanfins","Sernancelhe","Sernancelhe","Vila do Touro"],
    "Tabuaço":["Chavães","Desejosa","Sendim","Goujoim","Granja","Pereiro","Pinheiros","São João de Lagoaça","Sendim","Tabuaço","Távora","Vale de Figueira","Valença","Vermil"],
    "Tarouca":["Dalvares","Gravo","Mondim da Beira","Salzedas","São João de Tarouca","Tarouca","Várzea de Abrunhais"],
    "Tondela":["Barreiro de Besteiros","Canas de Santa Maria","Campo de Besteiros","Caparrosa","Castelões","Dardavaz","Destriz","Dures","Ferreirós do Dão","Guardão","Lajeosa do Dão","Lobão da Beira","Molelos","Mosteirinho","Mouraz","Nandufe","Parada de Gonta","Santiago de Besteiros","São João do Monte","Tondela","Tourigo","Tonda","Vil de Souto"],
    "Vila Nova de Paiva":["Alhais","Castainço","Pendilhe","Queiriga","Santa Leocádia","São João de Mosteiro","Touro","Valadares","Vila Cova à Coelheira","Vila Nova de Paiva"],
    "Viseu":["Abraveses","Barreiros","Campo","Cavernães","Cota","Couto de Baixo","Couto de Cima","Eixo","Fail","Fragosela","Gultade","Lordosa","Mundão","Orgens","Povolide","Ranhados","Repeses","São Cipriano","São João de Lourosa","São Pedro de France","São Salvador","Silgueiros","Torredeita","Travanca de Lagos","Vil de Souto","Viseu"],
    "Vouzela":["Alcofra","Cambra","Campia","Carvalhal de Vermilhas","Fataunços","Figueiredo","Fornelo do Monte","Queirã","Paços de Vilharigues","Pindelo dos Milagres","Santo Amaro de Cambra","São Miguel do Mato","Ventosa","Vouzela","Zunho"]
  },
  "Madeira": {
    "Calheta":["Arco da Calheta","Calheta","Estreito da Calheta","Fajã da Ovelha","Jardim do Mar","Paul do Mar","Ponta do Pargo","Prazeres"],
    "Câmara de Lobos":["Câmara de Lobos","Curral das Freiras","Estreito de Câmara de Lobos","Quinta Grande","Jardim da Serra"],
    "Funchal":["Funchal","Imaculado Coração de Maria","Monte","Santa Luzia","Santa Maria Maior","Santo António","São Gonçalo","São Martinho","São Pedro","São Roque","Sé"],
    "Machico":["Caniçal","Machico","Porto da Cruz","Santo António da Serra","Água de Pena"],
    "Ponta do Sol":["Canhas","Madalena do Mar","Ponta do Sol"],
    "Porto Moniz":["Achadas da Cruz","Ribeira da Janela","Porto Moniz","Seixal"],
    "Ribeira Brava":["Campanário","Ribeira Brava","Serra de Água","Tabua"],
    "Santa Cruz":["Camacha","Caniço","Gaula","Santa Cruz","Santo da Serra"],
    "Santana":["Arco de São Jorge","Faial","Ilha","Santana","São Jorge","São Roque do Faial"],
    "São Vicente":["Boaventura","Ponta Delgada","São Vicente"]
  },
  "Açores": {
    "Angra do Heroísmo":["Agualva","Altares","Angra do Heroísmo","Biscoitos","Doze Ribeiras","Feteira","Porto Judeu","Posto Santo","Raminho","Ribeirinha","Santa Bárbara","São Bartolomeu de Regatos","São Mateus da Calheta","Serreta","Terra Chã","Vila Nova","São Sebastião","Cinco Ribeiras"],
    "Calheta (São Jorge)":["Calheta","Norte Grande","Santo Antão","Topo","Urzelina"],
    "Corvo":["Corvo"],
    "Horta":["Capelo","Castelo Branco","Cedros","Concelho da Horta","Feteira","Flamengos","Horta","Pedro Miguel","Praia do Norte","Ribeirinha","Salão"],
    "Lagoa (Açores)":["Cabouco","Lagoa","Nossa Senhora do Rosário","Ribeira Chã"],
    "Lajes das Flores":["Fajã Grande","Fajãzinha","Lajedo","Lajes das Flores","Mosteiro","Santa Cruz das Flores"],
    "Lajes do Pico":["Lajes do Pico","Piedade","Ribeiras"],
    "Madalena":["Bandeiras","Candelária","Criação Velha","Madalena","Santa Luzia","Santo Amaro","São Mateus","Terra Alta"],
    "Nordeste":["Achadinha","Algarvia","Nordeste","Salga","Santana","São Pedro"],
    "Ponta Delgada":["Ajuda da Bretanha","Arrifes","Bretanha","Candelária","Capelas","Covoada","Fajã de Baixo","Fajã de Cima","Fenais da Luz","Ferraria","Ginetes","Mosteiros","Ponta Delgada","Remédios","Rosto do Cão","Santo António","São José","São Pedro","São Roque","São Sebastião","São Vicente Ferreira","Sete Cidades"],
    "Povoação":["Faial da Terra","Furnas","Nossa Senhora dos Remédios","Povoação","Ribeira Quente","São Brás","Água Retorta"],
    "Praia da Vitória":["Agualva","Biscoitos","Cabo da Praia","Fonte do Bastardo","Fontinhas","Lages","Porto Martins","Praia da Vitória","Quatro Ribeiras","Santa Cruz da Graciosa","Terra Chã","Vila Nova"],
    "Ribeira Grande":["Calhetas","Fenais da Ajuda","Lomba de São Pedro","Maia","Pico da Pedra","Porto Formoso","Rabo de Peixe","Ribeira Grande","Ribeirinha","Santa Bárbara","São Brás","Torre"],
    "Santa Cruz da Graciosa":["Guadalupe","Luz","Santa Cruz da Graciosa","São Mateus","Vila Nova"],
    "Santa Cruz das Flores":["Caveira","Santa Cruz das Flores","Cedros","Lajes das Flores"],
    "São Roque do Pico":["Prainha","São Roque do Pico","Topo"],
    "Velas":["Manadas","Norte Grande","Rosais","Santo Antão","Urzelina","Velas"],
    "Vila do Porto":["Alvo","Anjos","Santo Espírito","São Pedro","Vila do Porto","São Miguel"],
    "Vila Franca do Campo":["Água d'Alto","Ponta Garça","Ribeira das Tainhas","São Miguel","Vila Franca do Campo"]
  },
  "Bragança": {
    "Alfândega da Fé":["Alfândega da Fé","Cerejais","Eucísia","Ferradosa","Gebelim","Sambade","Sendim","Soeima","Vilar Chão"],
    "Bragança":["Alfaião","Baçal","Bragança","Calvelhe","Carragosa","Carrazedo","Castrelos","Castro de Avelãs","Coelhoso","Donai","Espinhosela","Faílde","Gimonde","Gondesende","Gostei","Grijó de Parada","Izeda","Macedo do Mato","Meixedo","Milhão","Mós","Nogueira","Oleiros","Outeiro","Parada","Parâmio","Pinela","Quintela de Lampaças","Rabal","Rio de Onor","Samil","Santa Maria","São João de Longa","São Pedro de Serracenos","Sé","Serapicos","Sortes","Zoio"],
    "Carrazeda de Ansiães":["Amedo","Belver","Beira Grande","Carrazeda de Ansiães","Castanheiro","Fonte Longa","Lavandeira","Linhares","Marzagão","Mogo de Malta","Pereiros","Pinhal do Norte","Pombal","Ribalonga","Seixo de Ansiães","Selores","Vilarinho de Mós"],
    "Freixo de Espada à Cinta":["Freixo de Espada à Cinta","Lagoaça","Ligares","Mazouco","Poiares"],
    "Macedo de Cavaleiros":["Amendoeira","Arcas","Bagueixe","Bornes","Burga","Carrapatas","Cortiços","Corujas","Edrosa","Espadanedo","Ferreira","Grijó","Lamalonga","Lamas","Lombo","Macedo de Cavaleiros","Morais","Olmos","Peredo dos Castelhanos","Podence","Salselas","Talhas","Vale Benfeito","Vale da Porca","Vale de Prades","Vale Pereiro","Vilarinho de Agrochão"],
    "Miranda do Douro":["Constantim","Duas Igrejas","Ifanes","Miranda do Douro","Malhadas","Palaçoulo","Picote","Póvoa","São Martinho de Angueira","Sendim","Silva"],
    "Mirandela":["Abreiro","Aguieiras","Álvaro","Abambres","Cabanelas","Cachão","Caravelas","Cedães","Cobro","Freixeda","Franco","Lamas de Orelhão","Mascarenhas","Mirandela","Mós","Múrias","Navalho","Passos","Pereira","Romeu","São Pedro Velho","São Salvador","Suçães","Tancos","Torre de Dona Chama","Vale de Lagoa","Valverde","Vilares","Vista Alegre"],
    "Mogadouro":["Azinhoso","Bemposta","Brunhoso","Brunhozinho","Castro Vicente","Conlelas","Lagoa","Meirinhos","Mogadouro","Paradela","Penas Roias","Peredo da Bemposta","Sanhoane","São Martinho do Peso","Soutelo","Travanca","Urrós","Ventozelo","Vila de Ala"],
    "Torre de Moncorvo":["Açoreira","Adeganha","Cardanha","Carviçais","Castedo","Felgar","Felgueiras","Larinho","Lousa","Maçores","Milhão","Mós","Mourão","Peredo dos Castelhanos","Torre de Moncorvo","Urros","Vila Flor"],
    "Vila Flor":["Assares","Candoso","Carvalhas","Freixiel","Lodões","Mourão","Nabo","Roios","Sampaio","Santa Comba de Vila Flor","Seixo de Manhoses","Vale Frechoso","Vilas Boas","Vila Flor"],
    "Vimioso":["Algoso","Angueira","Argozelo","Caçarelhos","Carção","Matela","Pinelo","Populares","São Chegado","Santulhão","Uva","Vilar Seco de Lomba","Vimioso"],
    "Vinhais":["Alvites","Edral","Edrosa","Ervedosa","Fresulfe","Moimenta","Mofreita","Montouto","Nunes","Paçô","Pinheiro Novo","Pinheiro Velho","Quirás","Santalha","Sobreiro de Baixo","Sobreiró de Cima","Soeira","Tuizelo","Valdrez","Vilar de Lomba","Vilar Seco de Lomba","Vilarinho das Furnas","Vinhais"]
  }
};

const STATUS_CFG = {
  "Quente":{ bg:"rgba(239,68,68,0.1)", color:"#ef4444", border:"rgba(239,68,68,0.3)" },
  "Morno": { bg:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"rgba(245,158,11,0.3)" },
  "Frio":  { bg:"rgba(59,130,246,0.1)", color:"#3b82f6", border:"rgba(59,130,246,0.3)" },
};
const AVATAR_COLORS = ["#3BB2A1","#4f46e5","#f59e0b","#10b981","#ef4444","#8b5cf6","#ec4899","#0ea5e9"];
const avatarColor = n => { let h=0; for(let i=0;i<(n||"").length;i++) h=(h+n.charCodeAt(i))%AVATAR_COLORS.length; return AVATAR_COLORS[h]; };
const initials = n => (n||"?").split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();

function parseVCF(text) {
  return text.split(/END:VCARD/i).filter(c=>c.trim()).map(card=>{
    const fn=card.match(/^FN[;:]([^\r\n]+)/mi), n=card.match(/^N[;:]([^\r\n]+)/mi);
    const tel=card.match(/^TEL[^:]*:([^\r\n]+)/mi), em=card.match(/^EMAIL[^:]*:([^\r\n]+)/mi);
    const name=fn?fn[1].trim():n?n[1].split(";").map(p=>p.trim()).filter(Boolean).reverse().join(" "):"";
    const phone=tel?tel[1].trim():"", email=em?em[1].trim():"";
    return (name||phone)?{id:Date.now()+Math.random(),name,phone,email,interests:[],typologies:[],districts:[],concelhos:[],freguesias:[],priceRange:"",status:"Frio",notes:""}:null;
  }).filter(Boolean);
}
function parseCSV(text) {
  const lines=text.trim().split(/\r?\n/); if(lines.length<2) return [];
  const h=lines[0].split(",").map(x=>x.replace(/"/g,"").trim().toLowerCase());
  const ni=h.findIndex(x=>x.includes("name")||x.includes("nome")), pi=h.findIndex(x=>x.includes("phone")||x.includes("tel")||x.includes("mobile")), ei=h.findIndex(x=>x.includes("email"));
  return lines.slice(1).map(line=>{const c=line.split(",").map(x=>x.replace(/"/g,"").trim());return{id:Date.now()+Math.random(),name:ni>=0?c[ni]:"",phone:pi>=0?c[pi]:"",email:ei>=0?c[ei]:"",interests:[],typologies:[],districts:[],concelhos:[],freguesias:[],priceRange:"",status:"Frio",notes:""};}).filter(c=>c.name||c.phone);
}

const MOCK_CONTACTS = [
  {id:1,name:"Ana Ferreira",    phone:"+351 912 345 678",email:"ana@email.pt",   interests:["Apartamento"],           typologies:["T2","T3"],   districts:["Lisboa"],  concelhos:["Cascais","Lisboa"],  freguesias:[],priceRange:"200k–350k€",status:"Quente",notes:"Procura imóvel para habitação própria"},
  {id:2,name:"João Mendes",     phone:"+351 963 456 789",email:"joao@email.pt",  interests:["Moradia"],               typologies:["T3","T4+"],  districts:["Lisboa"],  concelhos:["Sintra","Cascais"],  freguesias:[],priceRange:"350k–500k€",status:"Morno", notes:"Família com 2 filhos, precisa de jardim"},
  {id:3,name:"Carla Santos",    phone:"+351 934 567 890",email:"carla@email.pt", interests:["Investimento","Apartamento"],typologies:["T1","T2"],districts:["Porto"],  concelhos:["Porto","Vila Nova de Gaia"],  freguesias:[],priceRange:"100k–200k€",status:"Quente",notes:"Investidora, procura rendimento"},
  {id:4,name:"Miguel Costa",    phone:"+351 915 678 901",email:"miguel@email.pt",interests:["Comercial"],             typologies:["T0"],        districts:["Lisboa"],  concelhos:["Lisboa"],            freguesias:[],priceRange:"500k€+",   status:"Frio",  notes:"Empresário, expansão de negócio"},
  {id:5,name:"Sofia Rodrigues", phone:"+351 926 789 012",email:"sofia@email.pt", interests:["Apartamento"],           typologies:["T1"],        districts:["Porto"],   concelhos:["Matosinhos"],        freguesias:[],priceRange:"Até 100k€",status:"Morno", notes:"Primeira habitação"},
];
const MOCK_PROPERTIES = [
  {id:1,title:"Apartamento T2 em Cascais",type:"Apartamento",typology:"T2",district:"Lisboa",concelho:"Cascais",   freguesia:"Cascais e Estoril",price:285000,area:92, description:"Moderno apartamento com vista mar, acabamentos premium.",photos:[]},
  {id:2,title:"Moradia T4 em Sintra",     type:"Moradia",    typology:"T4+",district:"Lisboa",concelho:"Sintra",   freguesia:"Sintra",            price:420000,area:210,description:"Moradia com jardim e piscina, condomínio fechado.",   photos:[]},
];
const EMPTY_C={name:"",phone:"",email:"",interests:[],typologies:[],districts:[],concelhos:[],freguesias:[],priceRange:"",status:"Frio",notes:""};
const EMPTY_P={title:"",type:"",typology:"",district:"",concelho:"",freguesia:"",price:"",area:"",description:"",photos:[]};

// ─── SHARED STYLE HELPERS (accept theme as argument) ─────────────────────────
const mkStyles = (dark, isMobile) => {
  const D=dark;
  const v=(l,d)=>D?d:l;
  const teal="#3BB2A1";
  return {
    teal,
    bg:     v("#f1f5f9","#0f172a"),
    sidebar:v("#ffffff","#0f172a"),
    card:   v("#ffffff","#1e293b"),
    border: v("#e2e8f0","#334155"),
    text:   v("#0f172a","#f1f5f9"),
    muted:  v("#64748b","#94a3b8"),
    inp:    v("#f8fafc","#0f172a"),
    inpB:   v("#cbd5e1","#334155"),
    hover:  v("rgba(0,0,0,0.025)","rgba(255,255,255,0.04)"),
    thead:  v("#f8fafc","#1e293b"),
    navy:   v("#112D4E","#f1f5f9"),
    CARD: (card, border, im) => ({background:card,border:`1px solid ${border}`,borderRadius:14,padding:(im??isMobile)?16:24}),
    INP: (inp, inpB, text) => ({background:inp,border:`1px solid ${inpB}`,borderRadius:8,padding:"9px 13px",color:text,fontFamily:"inherit",fontSize:14,width:"100%",outline:"none"}),
    BTNP: {background:teal,color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:6},
    BTNS: (inp,border,muted) => ({background:inp,color:muted,border:`1px solid ${border}`,borderRadius:8,padding:"9px 18px",fontWeight:500,cursor:"pointer",fontSize:14,fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:6}),
    TH: (muted,thead) => ({padding:"11px 14px",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:muted,textAlign:"left",background:thead,whiteSpace:"nowrap"}),
    TD: (text,border) => ({padding:"12px 14px",fontSize:14,color:text,borderTop:`1px solid ${border}`}),
  };
};

// ─── PURE PRESENTATIONAL COMPONENTS (defined OUTSIDE main component) ─────────

function Badge({status}) {
  const cf=STATUS_CFG[status]||STATUS_CFG["Frio"];
  return <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:cf.bg,color:cf.color,border:`1px solid ${cf.border}`,whiteSpace:"nowrap"}}>{status}</span>;
}

function Chip({label,selected,onClick,teal,inpB,muted}) {
  return (
    <span onClick={onClick} style={{display:"inline-flex",padding:"4px 12px",borderRadius:20,fontSize:12,cursor:"pointer",margin:"3px",fontFamily:"inherit",fontWeight:500,
      background:selected?`${teal}20`:"transparent",border:`1px solid ${selected?teal:inpB}`,color:selected?teal:muted,transition:"all 0.15s"}}>
      {label}
    </span>
  );
}

function FL({label,children,muted}) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:11,fontWeight:700,color:muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</label>
      {children}
    </div>
  );
}

function AppModal({onClose,title,children,wide,isMobile,card,border,text,muted}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:card,border:`1px solid ${border}`,borderRadius:isMobile?"16px 16px 0 0":16,padding:isMobile?"24px 20px":28,width:"100%",maxWidth:isMobile?"100%":wide?680:500,maxHeight:isMobile?"92vh":"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:700,color:text}}>{title}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:muted,fontSize:24,lineHeight:1,padding:4}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LocationPicker({districts,concelhos,freguesias,onChange,teal,inp,inpB,muted,border}) {
  const availC = districts.flatMap(d=>Object.keys(PORTUGAL[d]||{}));
  const availF = concelhos.flatMap(c=>{ for(const d of districts){ if(PORTUGAL[d]?.[c]) return PORTUGAL[d][c]; } return []; });
  const togArr = (a,v) => a.includes(v)?a.filter(x=>x!==v):[...a,v];
  return (
    <div style={{display:"grid",gap:10}}>
      <div>
        <div style={{fontSize:11,fontWeight:700,color:muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>Distrito</div>
        <div style={{maxHeight:100,overflowY:"auto",padding:4,background:inp,borderRadius:8,border:`1px solid ${border}`}}>
          {Object.keys(PORTUGAL).map(d=>(
            <Chip key={d} label={d} selected={districts.includes(d)} teal={teal} inpB={inpB} muted={muted} onClick={()=>{
              const nd=togArr(districts,d);
              const nc=concelhos.filter(c=>nd.some(x=>PORTUGAL[x]?.[c]));
              onChange({districts:nd,concelhos:nc,freguesias:[]});
            }}/>
          ))}
        </div>
      </div>
      {districts.length>0&&(
        <div>
          <div style={{fontSize:11,fontWeight:700,color:muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>Concelho</div>
          <div style={{maxHeight:100,overflowY:"auto",padding:4,background:inp,borderRadius:8,border:`1px solid ${border}`}}>
            {availC.map(c=>(
              <Chip key={c} label={c} selected={concelhos.includes(c)} teal={teal} inpB={inpB} muted={muted} onClick={()=>onChange({districts,concelhos:togArr(concelhos,c),freguesias:[]})}/>
            ))}
          </div>
        </div>
      )}
      {concelhos.length>0&&availF.length>0&&(
        <div>
          <div style={{fontSize:11,fontWeight:700,color:muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>Freguesia (opcional)</div>
          <div style={{maxHeight:100,overflowY:"auto",padding:4,background:inp,borderRadius:8,border:`1px solid ${border}`}}>
            {availF.map(f=>(
              <Chip key={f} label={f} selected={freguesias.includes(f)} teal={teal} inpB={inpB} muted={muted} onClick={()=>onChange({districts,concelhos,freguesias:togArr(freguesias,f)})}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────
function ContactForm({contact, setContact, onSave, onClose, onDelete, isNew, isMobile, theme}) {
  const {teal,text,muted,inp,inpB,border,card,BTNP,BTNS:mkBTNS,INP:mkINP,FL:mkFL} = theme;
  const INP = mkINP(inp,inpB,text);
  const BTNS = mkBTNS(inp,border,muted);
  const set = f => setContact(c=>({...c,...f}));
  const togArr = (a,v) => a.includes(v)?a.filter(x=>x!==v):[...a,v];
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <AppModal onClose={onClose} title={isNew?"Novo Contacto":"Editar Contacto"} wide isMobile={isMobile} card={card} border={border} text={text} muted={muted}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
        <FL label="Nome *" muted={muted}><input style={INP} value={contact.name} onChange={e=>set({name:e.target.value})} placeholder="Nome completo"/></FL>
        <FL label="Telefone *" muted={muted}><input style={INP} value={contact.phone} onChange={e=>set({phone:e.target.value})} placeholder="+351 9XX XXX XXX"/></FL>
      </div>
      <FL label="Email" muted={muted}><input style={INP} value={contact.email} onChange={e=>set({email:e.target.value})} placeholder="email@exemplo.pt"/></FL>
      <div style={{background:inp,border:`1px solid ${border}`,borderRadius:10,padding:16,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:700,color:text,marginBottom:12}}>🏠 Critérios de Pesquisa</div>
        <FL label="Tipos de Imóvel" muted={muted}>
          <div>{INTERESTS.map(i=><Chip key={i} label={i} selected={(contact.interests||[]).includes(i)} teal={teal} inpB={inpB} muted={muted} onClick={()=>set({interests:togArr(contact.interests||[],i)})}/>)}</div>
        </FL>
        <FL label="Tipologia" muted={muted}>
          <div>{TYPOLOGIES.map(t=><Chip key={t} label={t} selected={(contact.typologies||[]).includes(t)} teal={teal} inpB={inpB} muted={muted} onClick={()=>set({typologies:togArr(contact.typologies||[],t)})}/>)}</div>
        </FL>
        <FL label="Localização" muted={muted}>
          <LocationPicker
            districts={contact.districts||[]} concelhos={contact.concelhos||[]} freguesias={contact.freguesias||[]}
            teal={teal} inp={inp} inpB={inpB} muted={muted} border={border}
            onChange={({districts,concelhos,freguesias})=>set({districts,concelhos,freguesias})}
          />
        </FL>
        <FL label="Budget" muted={muted}>
          <select style={INP} value={contact.priceRange} onChange={e=>set({priceRange:e.target.value})}>
            <option value="">Seleccionar</option>
            {PRICE_RANGES.map(p=><option key={p}>{p}</option>)}
          </select>
        </FL>
      </div>
      <FL label="Estado" muted={muted}>
        <select style={INP} value={contact.status} onChange={e=>set({status:e.target.value})}>
          <option>Quente</option><option>Morno</option><option>Frio</option>
        </select>
      </FL>
      <FL label="Notas" muted={muted}><textarea style={{...INP,resize:"vertical"}} rows={3} value={contact.notes} onChange={e=>set({notes:e.target.value})} placeholder="Informações adicionais..."/></FL>
      {!isNew&&(confirmDel
        ?<div style={{background:"#ef444411",border:"1px solid #ef444433",borderRadius:10,padding:14,marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:600,color:"#ef4444",marginBottom:10}}>⚠️ Tens a certeza que queres eliminar este contacto?</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setConfirmDel(false)} style={{...BTNS,flex:1,justifyContent:"center",fontSize:13}}>Cancelar</button>
            <button onClick={onDelete} style={{background:"#ef4444",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:600,cursor:"pointer",fontSize:13,flex:1,justifyContent:"center",display:"inline-flex",alignItems:"center",gap:6}}>
              <span className="material-icons-outlined" style={{fontSize:15}}>delete</span>Eliminar
            </button>
          </div>
        </div>
        :<button onClick={()=>setConfirmDel(true)} style={{...BTNS,width:"100%",justifyContent:"center",color:"#ef4444",borderColor:"#ef444433",marginBottom:14,fontSize:13}}>
          <span className="material-icons-outlined" style={{fontSize:15}}>delete</span>Eliminar Contacto
        </button>
      )}
      <div style={{display:"flex",gap:10,marginTop:6}}>
        <button onClick={onClose} style={{...BTNS,flex:1,justifyContent:"center"}}>Cancelar</button>
        <button onClick={onSave} style={{...BTNP,flex:1,justifyContent:"center"}}>
          <span className="material-icons-outlined" style={{fontSize:16}}>save</span>Guardar
        </button>
      </div>
    </AppModal>
  );
}

// ─── PROPERTY FORM ────────────────────────────────────────────────────────────
function PropertyForm({property, setProperty, onSave, onClose, onDelete, isNew, isMobile, theme, onPhotos}) {
  const {teal,text,muted,inp,inpB,border,card,BTNP,BTNS:mkBTNS,INP:mkINP} = theme;
  const INP = mkINP(inp,inpB,text);
  const BTNS = mkBTNS(inp,border,muted);
  const set = f => setProperty(p=>({...p,...f}));
  const [confirmDel, setConfirmDel] = useState(false);
  const availC = property.district?Object.keys(PORTUGAL[property.district]||{}):[];
  const availF = (property.district&&property.concelho)?PORTUGAL[property.district]?.[property.concelho]||[]:[];
  const pc = (property.photos||[]).length;
  return (
    <AppModal onClose={onClose} title={isNew?"Novo Imóvel":"Editar Imóvel"} wide isMobile={isMobile} card={card} border={border} text={text} muted={muted}>
      <FL label="Título *" muted={muted}><input style={INP} value={property.title} onChange={e=>set({title:e.target.value})} placeholder="Ex: Apartamento T2 em Cascais"/></FL>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
        <FL label="Tipo *" muted={muted}><select style={INP} value={property.type} onChange={e=>set({type:e.target.value})}><option value="">Seleccionar</option>{INTERESTS.map(i=><option key={i}>{i}</option>)}</select></FL>
        <FL label="Tipologia" muted={muted}><select style={INP} value={property.typology} onChange={e=>set({typology:e.target.value})}><option value="">Seleccionar</option>{TYPOLOGIES.map(t=><option key={t}>{t}</option>)}</select></FL>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:12}}>
        <FL label="Distrito" muted={muted}>
          <select style={INP} value={property.district} onChange={e=>set({district:e.target.value,concelho:"",freguesia:""})}>
            <option value="">Distrito</option>{Object.keys(PORTUGAL).map(d=><option key={d}>{d}</option>)}
          </select>
        </FL>
        <FL label="Concelho" muted={muted}>
          <select style={INP} value={property.concelho} onChange={e=>set({concelho:e.target.value,freguesia:""})} disabled={!property.district}>
            <option value="">Concelho</option>{availC.map(c=><option key={c}>{c}</option>)}
          </select>
        </FL>
        <FL label="Freguesia" muted={muted}>
          <select style={INP} value={property.freguesia} onChange={e=>set({freguesia:e.target.value})} disabled={!property.concelho}>
            <option value="">Freguesia</option>{availF.map(f=><option key={f}>{f}</option>)}
          </select>
        </FL>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FL label="Preço (€)" muted={muted}><input style={INP} type="number" value={property.price} onChange={e=>set({price:e.target.value})} placeholder="250000"/></FL>
        <FL label="Área (m²)" muted={muted}><input style={INP} type="number" value={property.area} onChange={e=>set({area:e.target.value})} placeholder="95"/></FL>
      </div>
      <FL label="Descrição" muted={muted}><textarea style={{...INP,resize:"vertical"}} rows={3} value={property.description} onChange={e=>set({description:e.target.value})} placeholder="Descreva o imóvel..."/></FL>
      <FL label={`Fotografias (${pc}/10)${pc<5?" — mínimo 5 recomendado":""}`} muted={muted}>
        <div>
          {pc<10&&<label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:8,background:`${teal}18`,border:`1px dashed ${teal}`,color:teal,cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:10}}>
            <span className="material-icons-outlined" style={{fontSize:18}}>add_photo_alternate</span>Adicionar fotos
            <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={onPhotos}/>
          </label>}
          {pc>0&&pc<5&&<span style={{fontSize:12,color:"#f59e0b",marginLeft:8}}>⚠️ Faltam {5-pc} fotos</span>}
          {pc>0?(
            <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?3:5},1fr)`,gap:8,marginTop:8}}>
              {(property.photos||[]).map((ph,i)=>(
                <div key={ph.id} style={{position:"relative",aspectRatio:"1",borderRadius:8,overflow:"hidden",border:`2px solid ${i===0?teal:border}`}}>
                  <img src={ph.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  <button onClick={()=>setProperty(p=>({...p,photos:p.photos.filter(x=>x.id!==ph.id)}))} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,0.65)",border:"none",borderRadius:"50%",width:22,height:22,cursor:"pointer",color:"#fff",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  {i===0&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:`${teal}cc`,fontSize:9,color:"#fff",textAlign:"center",padding:"2px 0",fontWeight:700}}>PRINCIPAL</div>}
                </div>
              ))}
            </div>
          ):(
            <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:`2px dashed ${border}`,borderRadius:10,padding:24,cursor:"pointer",background:inp,marginTop:4}}>
              <span className="material-icons-outlined" style={{fontSize:32,color:muted,marginBottom:6}}>add_photo_alternate</span>
              <div style={{fontSize:13,color:muted}}>Clica para adicionar fotografias</div>
              <div style={{fontSize:11,color:muted,marginTop:2}}>PNG, JPG · mínimo 5 fotos</div>
              <input type="file" accept="image/*" multiple style={{display:"none"}} onChange={onPhotos}/>
            </label>
          )}
        </div>
      </FL>
      {!isNew&&(confirmDel
        ?<div style={{background:"#ef444411",border:"1px solid #ef444433",borderRadius:10,padding:14,marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:600,color:"#ef4444",marginBottom:10}}>⚠️ Tens a certeza que queres eliminar este imóvel?</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setConfirmDel(false)} style={{...BTNS,flex:1,justifyContent:"center",fontSize:13}}>Cancelar</button>
            <button onClick={onDelete} style={{background:"#ef4444",color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:600,cursor:"pointer",fontSize:13,flex:1,justifyContent:"center",display:"inline-flex",alignItems:"center",gap:6}}>
              <span className="material-icons-outlined" style={{fontSize:15}}>delete</span>Eliminar
            </button>
          </div>
        </div>
        :<button onClick={()=>setConfirmDel(true)} style={{...BTNS,width:"100%",justifyContent:"center",color:"#ef4444",borderColor:"#ef444433",marginBottom:14,fontSize:13}}>
          <span className="material-icons-outlined" style={{fontSize:15}}>delete</span>Eliminar Imóvel
        </button>
      )}
      <div style={{display:"flex",gap:10,marginTop:6}}>
        <button onClick={onClose} style={{...BTNS,flex:1,justifyContent:"center"}}>Cancelar</button>
        <button onClick={onSave} style={{...BTNP,flex:1,justifyContent:"center"}}>
          <span className="material-icons-outlined" style={{fontSize:16}}>save</span>Guardar Imóvel
        </button>
      </div>
    </AppModal>
  );
}

// ─── SEND MODAL ───────────────────────────────────────────────────────────────
function SendModal({property, contacts, onClose, isMobile, theme}) {
  const photoCount = (property?.photos||[]).length;
  const photoNote = photoCount>0 ? `\n📷 ${photoCount} foto${photoCount>1?"s":""} disponíve${photoCount>1?"is":"l"}.` : "";
  const [msg, setMsg] = useState(property?`Olá {nome}! Tenho um imóvel que pode ser do seu interesse: ${property.title} por ${property.price?.toLocaleString("pt-PT")}€.${photoNote} Tem interesse em saber mais?`:"");
  const [sentIds, setSentIds] = useState([]);
  const {teal,text,muted,inp,inpB,border,card,BTNP,BTNS:mkBTNS,INP:mkINP} = theme;
  const INP = mkINP(inp,inpB,text);
  const BTNS = mkBTNS(inp,border,muted);
  const matches = property?contacts.filter(c=>(c.interests||[]).includes(property.type)&&(!(c.typologies||[]).length||(c.typologies||[]).includes(property.typology))&&(!(c.concelhos||[]).length||(c.concelhos||[]).includes(property.concelho))):[];
  const getScore = c => { let s=0; if((c.interests||[]).includes(property.type))s++; if(!(c.typologies||[]).length||(c.typologies||[]).includes(property.typology))s++; if(!(c.concelhos||[]).length||(c.concelhos||[]).includes(property.concelho))s++; return Math.round(s/3*100); };
  const sendOne = c => { const phone=c.phone.replace(/\D/g,""); const m=encodeURIComponent(msg.replace(/\{nome\}/g,c.name.split(" ")[0])); window.open(`https://wa.me/${phone}?text=${m}`,"_blank"); setSentIds(p=>[...p,c.id]); };
  if(!property) return null;
  return (
    <AppModal onClose={onClose} title="Enviar via WhatsApp" wide isMobile={isMobile} card={card} border={border} text={text} muted={muted}>
      {/* Property preview with photo */}
      <div style={{display:"flex",gap:12,background:inp,borderRadius:10,padding:12,marginTop:-14,marginBottom:14,alignItems:"center"}}>
        <div style={{width:64,height:64,borderRadius:8,overflow:"hidden",background:`${teal}22`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
          {property.photos?.[0]?.url
            ?<img src={property.photos[0].url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :"🏠"}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,color:text,fontSize:14}}>{property.title}</div>
          <div style={{fontSize:13,color:teal,fontWeight:600}}>{property.price?.toLocaleString("pt-PT")}€</div>
          <div style={{fontSize:11,color:muted,marginTop:2}}>📷 {photoCount} foto{photoCount!==1?"s":""} · {property.typology} · {property.area}m²</div>
        </div>
      </div>
      <FL label="Mensagem (usa {nome} para personalizar)" muted={muted}><textarea style={{...INP,resize:"vertical"}} rows={3} value={msg} onChange={e=>setMsg(e.target.value)}/></FL>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,color:text}}>{matches.length} contactos correspondentes</div>
        {sentIds.length>0&&<div style={{fontSize:12,color:"#10b981",fontWeight:600}}>✓ {sentIds.length} enviados</div>}
      </div>
      {matches.length===0?(
        <div style={{textAlign:"center",padding:24,color:muted,fontSize:14,background:inp,borderRadius:10,marginBottom:14}}>Nenhum contacto com este perfil.</div>
      ):(
        <div style={{background:inp,borderRadius:10,border:`1px solid ${border}`,overflow:"hidden",marginBottom:14}}>
          {matches.map(c=>{
            const sc=getScore(c), scC=sc>=80?"#10b981":sc>=60?"#f59e0b":"#ef4444", sent=sentIds.includes(c.id);
            return (
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:isMobile?"12px":"13px 16px",borderBottom:`1px solid ${border}`,background:sent?`${teal}08`:"",flexWrap:isMobile?"wrap":"nowrap"}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:avatarColor(c.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{initials(c.name)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:text}}>{c.name}</div>
                  <div style={{fontSize:12,color:muted}}>{c.phone}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <span style={{fontSize:12,fontWeight:700,color:scC}}>{sc}%</span>
                  <Badge status={c.status}/>
                  {sent
                    ?<div style={{padding:"7px 12px",borderRadius:8,background:"#10b98118",border:"1px solid #10b98144",fontSize:12,color:"#10b981",fontWeight:600}}>✓ Enviado</div>
                    :<button onClick={()=>sendOne(c)} style={{...BTNP,padding:"7px 12px",fontSize:12}}>
                      <span className="material-icons-outlined" style={{fontSize:14}}>chat</span>Enviar
                    </button>
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button onClick={onClose} style={{...BTNS,width:"100%",justifyContent:"center"}}>Fechar</button>
    </AppModal>
  );
}

// ─── PROPERTY CARD ─────────────────────────────────────────────────────────
function PropCard({p, onEdit, onSend, matchCount, isMobile, theme}) {
  const {teal,text,muted,card,border,BTNP,BTNS:mkBTNS,inp} = theme;
  const BTNS = mkBTNS(inp,border,muted);
  const main = p.photos?.[0]?.url;
  return (
    <div style={{background:card,border:`1px solid ${border}`,borderRadius:14,padding:0,overflow:"hidden",transition:"transform 0.2s,box-shadow 0.2s"}}
      onMouseEnter={e=>{if(!isMobile){e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 28px rgba(0,0,0,0.1)";}}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
      <div style={{height:isMobile?140:160,position:"relative",overflow:"hidden",background:`linear-gradient(135deg,${teal}22,#112D4E22)`}}>
        {main?<img src={main} alt={p.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52}}>🏠</div>}
        {p.photos&&p.photos.length>1&&<div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.6)",borderRadius:6,padding:"3px 8px",fontSize:11,color:"#fff"}}>📷 {p.photos.length}</div>}
        <div style={{position:"absolute",top:10,right:10,background:"#10b98122",border:"1px solid #10b98144",borderRadius:8,padding:"4px 10px",fontSize:12,color:"#10b981",fontWeight:600}}>{matchCount} interessados</div>
        <button onClick={onEdit} style={{position:"absolute",top:10,left:10,background:"rgba(0,0,0,0.5)",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",gap:4,fontSize:12}}>
          <span className="material-icons-outlined" style={{fontSize:14}}>edit</span>Editar
        </button>
      </div>
      <div style={{padding:isMobile?14:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <h3 style={{fontSize:15,fontWeight:700,color:text,flex:1,paddingRight:8}}>{p.title}</h3>
          <span style={{fontSize:16,fontWeight:700,color:teal,flexShrink:0}}>{p.price?.toLocaleString("pt-PT")}€</span>
        </div>
        <div style={{fontSize:12,color:muted,marginBottom:10}}>📍 {[p.freguesia,p.concelho,p.district].filter(Boolean).join(", ")} · {p.typology} · {p.area}m²</div>
        <p style={{fontSize:13,color:muted,marginBottom:14,lineHeight:1.6}}>{p.description}</p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onSend} style={{...BTNP,flex:1,justifyContent:"center",fontSize:13,padding:"8px 12px"}}>
            <span className="material-icons-outlined" style={{fontSize:15}}>chat</span>WhatsApp
          </button>
          <button style={{...BTNS,flex:1,justifyContent:"center",fontSize:13,padding:"8px 12px"}}>📸 Redes</button>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({dark}) {
  const [mode,  setMode]  = useState("login"); // "login" | "signup"
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const teal="#3BB2A1";
  const bg    = dark?"#0f172a":"#f1f5f9";
  const card  = dark?"#1e293b":"#ffffff";
  const border= dark?"#334155":"#e2e8f0";
  const text  = dark?"#f1f5f9":"#0f172a";
  const muted = dark?"#94a3b8":"#64748b";
  const inp   = dark?"#0f172a":"#f8fafc";
  const inpB  = dark?"#334155":"#cbd5e1";
  const INP = {background:inp,border:`1px solid ${inpB}`,borderRadius:8,padding:"10px 13px",color:text,fontFamily:"inherit",fontSize:14,width:"100%",outline:"none",boxSizing:"border-box"};

  const handle = async () => {
    setLoading(true); setError("");
    try {
      if(mode==="login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
        if(error) setError(error.message==="Invalid login credentials"?"Email ou palavra-passe incorrectos.":error.message);
      } else {
        if(!name.trim()) { setError("Indica o teu nome."); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email: email.trim(), password: pass,
          options: { data: { name: name.trim() } }
        });
        if(error) setError(error.message);
        else setError("✅ Conta criada! Verifica o teu email para confirmar.");
      }
    } catch(e) { setError("Erro de ligação. Tenta novamente."); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Inter',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:56,height:56,background:teal,borderRadius:14,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
            <span className="material-icons-outlined" style={{color:"#fff",fontSize:28}}>home_work</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:text,margin:0}}>ImoPro</h1>
          <p style={{fontSize:14,color:muted,marginTop:4}}>Gestão Imobiliária Profissional</p>
        </div>
        <div style={{background:card,border:`1px solid ${border}`,borderRadius:16,padding:28}}>
          {/* Tabs */}
          <div style={{display:"flex",marginBottom:24,background:inp,borderRadius:10,padding:4}}>
            {[["login","Entrar"],["signup","Criar conta"]].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,background:mode===m?card:"transparent",color:mode===m?text:muted,boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all 0.15s"}}>{l}</button>
            ))}
          </div>

          {mode==="signup"&&<div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Nome</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="O teu nome" style={INP}/>
          </div>}
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} placeholder="o_teu@email.pt" style={INP}/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Palavra-passe</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} placeholder="••••••••" style={INP}/>
            {mode==="signup"&&<div style={{fontSize:11,color:muted,marginTop:4}}>Mínimo 6 caracteres</div>}
          </div>

          {error&&<div style={{background:error.startsWith("✅")?"#10b98111":"#ef444411",border:`1px solid ${error.startsWith("✅")?"#10b98133":"#ef444433"}`,borderRadius:8,padding:"10px 14px",color:error.startsWith("✅")?"#10b981":"#ef4444",fontSize:13,marginBottom:14}}>{error}</div>}

          <button onClick={handle} disabled={loading} style={{width:"100%",background:teal,color:"#fff",border:"none",borderRadius:8,padding:"11px",fontWeight:700,cursor:loading?"not-allowed":"pointer",fontSize:15,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:loading?0.7:1}}>
            {loading
              ?<><span className="material-icons-outlined" style={{fontSize:18,animation:"spin 1s linear infinite"}}>autorenew</span>A processar...</>
              :mode==="login"
                ?<><span className="material-icons-outlined" style={{fontSize:18}}>login</span>Entrar</>
                :<><span className="material-icons-outlined" style={{fontSize:18}}>person_add</span>Criar conta</>
            }
          </button>
        </div>
        <p style={{textAlign:"center",fontSize:12,color:muted,marginTop:16}}>ImoPro © {new Date().getFullYear()}</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const NAV_ITEMS=[{id:"dashboard",icon:"home",label:"Início"},{id:"contacts",icon:"people",label:"Contactos"},{id:"properties",icon:"apartment",label:"Imóveis"},{id:"matches",icon:"auto_awesome",label:"Matches"},{id:"campaigns",icon:"bar_chart",label:"Campanhas"},{id:"social",icon:"share",label:"Redes Sociais"}];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function ImoPro() {
  const [session,   setSession]   = useState(undefined); // undefined=loading, null=logged out
  const [profile,   setProfile]   = useState(null);
  const [dark,      setDark]      = useState(false);
  const [page,      setPage]      = useState("dashboard");
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [contacts,    setContacts]    = useState([]);
  const [properties,  setProperties]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState("");
  const [filterInt, setFilterInt] = useState("");
  const [notif,     setNotif]     = useState(null);
  const [editContact,   setEditContact]  = useState(null);
  const [isNewContact,  setIsNewContact] = useState(false);
  const [editProperty,  setEditProperty] = useState(null);
  const [isNewProperty, setIsNewProperty]= useState(false);
  const [sendProp,  setSendProp]  = useState(null);
  const [showImport,setShowImport]= useState(false);
  const [importPrev,setImportPrev]= useState([]);
  const [importErr, setImportErr] = useState("");
  const [isMobile,  setIsMobile]  = useState(window.innerWidth<768);
  const [isTablet,  setIsTablet]  = useState(window.innerWidth<1024);

  // ── Responsive listener ──
  useEffect(()=>{
    const h=()=>{setIsMobile(window.innerWidth<768);setIsTablet(window.innerWidth<1024);};
    window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h);
  },[]);

  // ── Auth listener ──
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>setSession(session));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>{
      setSession(session);
      if(!session){ setContacts([]); setProperties([]); setProfile(null); }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  // ── Load profile + data when session changes ──
  useEffect(()=>{
    if(!session) return;
    loadProfile();
    loadContacts();
    loadProperties();
  },[session]);

  const loadProfile = async()=>{
    const {data} = await supabase.from("profiles").select("*").eq("id",session.user.id).single();
    setProfile(data);
  };

  const loadContacts = async()=>{
    const {data,error} = await supabase.from("contacts").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false});
    if(!error) setContacts(data||[]);
  };

  const loadProperties = async()=>{
    const {data,error} = await supabase.from("properties").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false});
    if(!error) setProperties(data||[]);
  };

  // ── Theme ──
  const S = mkStyles(dark, isMobile);
  const {teal,bg,sidebar,card,border,text,muted,inp,inpB,hover,thead,navy,BTNP,CARD:mkCARD,INP:mkINP,TH:mkTH,TD:mkTD} = S;
  const BTNS = S.BTNS(inp,border,muted);
  const CARD = mkCARD(card,border);
  const INP  = mkINP(inp,inpB,text);
  const TH   = mkTH(muted,thead);
  const TD   = mkTD(text,border);
  const theme = {...S,BTNP,BTNS:S.BTNS,INP:mkINP,CARD:mkCARD,TH:mkTH,TD:mkTD};

  const showNotif = msg=>{setNotif(msg);setTimeout(()=>setNotif(null),3500);};

  const getMatches = useCallback(p=>contacts.filter(c=>
    (c.interests||[]).includes(p.type)&&
    (!(c.typologies||[]).length||(c.typologies||[]).includes(p.typology))&&
    (!(c.concelhos||[]).length||(c.concelhos||[]).includes(p.concelho))
  ),[contacts]);

  const getScore = (c,p)=>{ let s=0; if((c.interests||[]).includes(p.type))s++; if(!(c.typologies||[]).length||(c.typologies||[]).includes(p.typology))s++; if(!(c.concelhos||[]).length||(c.concelhos||[]).includes(p.concelho))s++; return Math.round(s/3*100); };

  const filtered = contacts.filter(c=>{
    const ms=c.name.toLowerCase().includes(search.toLowerCase())||(c.phone||"").includes(search);
    const mi=filterInt?(c.interests||[]).includes(filterInt):true;
    return ms&&mi;
  });

  // ── CRUD: Contacts ──
  const saveContact = async()=>{
    if(!editContact.name||!editContact.phone) return;
    setLoading(true);
    const payload = {
      name:editContact.name, phone:editContact.phone, email:editContact.email||"",
      interests:editContact.interests||[], typologies:editContact.typologies||[],
      districts:editContact.districts||[], concelhos:editContact.concelhos||[],
      freguesias:editContact.freguesias||[], price_range:editContact.priceRange||editContact.price_range||"",
      status:editContact.status||"Frio", notes:editContact.notes||"",
    };
    let error;
    if(isNewContact) {
      ({error} = await supabase.from("contacts").insert({...payload,user_id:session.user.id}));
    } else {
      ({error} = await supabase.from("contacts").update(payload).eq("id",editContact.id));
    }
    if(!error){ await loadContacts(); setEditContact(null); showNotif(isNewContact?"Contacto adicionado!":"Contacto actualizado!"); }
    else showNotif("Erro ao guardar: "+error.message);
    setLoading(false);
  };

  const deleteContact = async()=>{
    setLoading(true);
    const {error} = await supabase.from("contacts").delete().eq("id",editContact.id);
    if(!error){ await loadContacts(); setEditContact(null); showNotif("Contacto eliminado."); }
    else showNotif("Erro ao eliminar: "+error.message);
    setLoading(false);
  };

  // ── CRUD: Properties ──
  const saveProperty = async()=>{
    if(!editProperty.title||!editProperty.type) return;
    setLoading(true);
    const payload = {
      title:editProperty.title, type:editProperty.type, typology:editProperty.typology||"",
      district:editProperty.district||"", concelho:editProperty.concelho||"",
      freguesia:editProperty.freguesia||"", price:Number(editProperty.price)||0,
      area:Number(editProperty.area)||0, description:editProperty.description||"",
      photos:editProperty.photos||[],
    };
    let error;
    if(isNewProperty) {
      ({error} = await supabase.from("properties").insert({...payload,user_id:session.user.id}));
    } else {
      ({error} = await supabase.from("properties").update(payload).eq("id",editProperty.id));
    }
    if(!error){ await loadProperties(); setEditProperty(null); showNotif(isNewProperty?"Imóvel adicionado!":"Imóvel actualizado!"); }
    else showNotif("Erro ao guardar: "+error.message);
    setLoading(false);
  };

  const deleteProperty = async()=>{
    setLoading(true);
    // Apagar fotos do storage
    const photos = editProperty.photos||[];
    if(photos.length>0){
      const paths = photos.map(ph=>{
        const url = ph.url||"";
        const match = url.match(/property-photos\/(.+)$/);
        return match?match[1]:null;
      }).filter(Boolean);
      if(paths.length>0) await supabase.storage.from("property-photos").remove(paths);
    }
    const {error} = await supabase.from("properties").delete().eq("id",editProperty.id);
    if(!error){ await loadProperties(); setEditProperty(null); showNotif("Imóvel eliminado."); }
    else showNotif("Erro ao eliminar: "+error.message);
    setLoading(false);
  };

  // ── Photo upload to Supabase Storage ──
  const handlePhotos = async(e)=>{
    const files = Array.from(e.target.files);
    e.target.value="";
    const current = editProperty.photos||[];
    const remaining = 10-current.length;
    if(remaining<=0) return;
    const toUpload = files.slice(0,remaining);
    showNotif(`A carregar ${toUpload.length} foto${toUpload.length>1?"s":""}...`);
    const uploaded = await Promise.all(toUpload.map(async(file)=>{
      const ext = file.name.split(".").pop();
      const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const {error} = await supabase.storage.from("property-photos").upload(path, file, {contentType:file.type});
      if(error) return null;
      const {data:{publicUrl}} = supabase.storage.from("property-photos").getPublicUrl(path);
      return {id:Date.now()+Math.random(), url:publicUrl, name:file.name};
    }));
    const ok = uploaded.filter(Boolean);
    setEditProperty(p=>({...p, photos:[...(p.photos||[]),...ok].slice(0,10)}));
    showNotif(`${ok.length} foto${ok.length>1?"s":""} carregada${ok.length>1?"s":""}!`);
  };

  // ── Import contacts ──
  const handleImportFile = e=>{
    const file=e.target.files[0]; if(!file)return; setImportErr("");
    const r=new FileReader();
    r.onload=ev=>{ const t=ev.target.result; let p=[];
      if(file.name.toLowerCase().endsWith(".vcf")) p=parseVCF(t);
      else if(file.name.toLowerCase().endsWith(".csv")) p=parseCSV(t);
      else{setImportErr("Usa .vcf ou .csv");return;}
      if(!p.length){setImportErr("Nenhum contacto encontrado.");return;}
      setImportPrev(p);
    };
    r.readAsText(file,"UTF-8"); e.target.value="";
  };

  const confirmImport = async()=>{
    const existing = contacts.map(c=>c.phone).filter(Boolean);
    const newOnes = importPrev.filter(p=>!existing.includes(p.phone)).map(c=>({
      user_id:session.user.id, name:c.name||"Sem nome", phone:c.phone||"",
      email:c.email||"", interests:[], typologies:[], districts:[], concelhos:[],
      freguesias:[], price_range:"", status:"Frio", notes:"",
    }));
    if(!newOnes.length){showNotif("Nenhum contacto novo para importar.");setShowImport(false);return;}
    setLoading(true);
    const {error} = await supabase.from("contacts").insert(newOnes);
    if(!error){ await loadContacts(); setImportPrev([]); setShowImport(false); showNotif(`${newOnes.length} contactos importados!`); }
    else showNotif("Erro na importação: "+error.message);
    setLoading(false);
  };

  const PAGE_TITLE = {dashboard:"Início",contacts:"Contactos",properties:"Imóveis",matches:"Matches",campaigns:"Campanhas",social:"Redes Sociais"}[page];
  const currentUser = profile ? {...profile, name: profile.name||session?.user?.email||"Utilizador"} : null;

  // ── Loading inicial ──
  if(session===undefined) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f1f5f9",fontFamily:"Inter,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:56,height:56,background:"#3BB2A1",borderRadius:14,display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
          <span className="material-icons-outlined" style={{color:"#fff",fontSize:28}}>home_work</span>
        </div>
        <div style={{fontSize:14,color:"#64748b"}}>A carregar...</div>
      </div>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
    </div>
  );

  if(!session) return <LoginScreen dark={dark}/>;

  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:bg,minHeight:"100vh",color:text,transition:"all 0.2s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px}select{appearance:none}input:focus,textarea:focus,select:focus{border-color:#3BB2A1!important;outline:none}`}</style>

      {notif&&<div style={{position:"fixed",top:20,right:20,zIndex:1000,background:teal,color:"#fff",borderRadius:10,padding:"12px 20px",fontSize:14,fontWeight:600,boxShadow:"0 8px 24px rgba(59,178,161,0.35)",display:"flex",alignItems:"center",gap:8}}>
        <span className="material-icons-outlined" style={{fontSize:18}}>check_circle</span>{notif}
      </div>}

      {loading&&<div style={{position:"fixed",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${teal},#4f46e5)`,zIndex:2000,animation:"progress 1s ease-in-out infinite"}}/>}
      <style>{`@keyframes progress{0%{width:0%}50%{width:70%}100%{width:100%}}`}</style>

      {isMobile&&menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:150}}/>}

      <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
        {/* SIDEBAR */}
        <aside style={{width:isMobile?(menuOpen?260:0):isTablet?60:236,background:sidebar,borderRight:`1px solid ${border}`,display:"flex",flexDirection:"column",flexShrink:0,transition:"all 0.25s",overflow:"hidden",position:isMobile?"fixed":"relative",height:"100vh",zIndex:isMobile?200:1}}>
          <div style={{padding:"20px 16px 16px",borderBottom:`1px solid ${border}`,flexShrink:0}}>
            {(!isTablet||isMobile)&&<div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,background:teal,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span className="material-icons-outlined" style={{color:"#fff",fontSize:18}}>home_work</span>
              </div>
              <span style={{fontSize:20,fontWeight:700,color:navy,letterSpacing:"-0.5px",whiteSpace:"nowrap"}}>ImoPro</span>
            </div>}
            {isTablet&&!isMobile&&<div style={{display:"flex",justifyContent:"center"}}>
              <div style={{width:34,height:34,background:teal,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><span className="material-icons-outlined" style={{color:"#fff",fontSize:18}}>home_work</span></div>
            </div>}
          </div>
          <nav style={{flex:1,padding:"12px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
            {NAV_ITEMS.map(({id,icon,label})=>{
              const active=page===id;
              return (
                <button key={id} onClick={()=>{setPage(id);if(isMobile)setMenuOpen(false);}} title={isTablet&&!isMobile?label:""}
                  style={{display:"flex",alignItems:"center",gap:isTablet&&!isMobile?0:12,padding:isTablet&&!isMobile?"10px":"10px 12px",justifyContent:isTablet&&!isMobile?"center":"flex-start",borderRadius:8,background:active?`${teal}18`:"transparent",borderRight:active&&!isTablet?`3px solid ${teal}`:"3px solid transparent",border:"none",cursor:"pointer",width:"100%",fontFamily:"inherit",fontSize:14,fontWeight:500,color:active?teal:muted,transition:"all 0.15s",textAlign:"left",position:"relative"}}>
                  <span className="material-icons-outlined" style={{fontSize:20,flexShrink:0}}>{icon}</span>
                  {(!isTablet||isMobile)&&<span style={{whiteSpace:"nowrap"}}>{label}</span>}
                  {isTablet&&!isMobile&&active&&<div style={{position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",width:3,height:24,background:teal,borderRadius:2}}/>}
                </button>
              );
            })}
          </nav>
          <div style={{padding:"10px 8px",borderTop:`1px solid ${border}`,flexShrink:0}}>
            <button onClick={()=>setDark(!dark)} title={dark?"Modo Claro":"Modo Escuro"}
              style={{display:"flex",alignItems:"center",gap:isTablet&&!isMobile?0:10,padding:isTablet&&!isMobile?"9px":"9px 12px",justifyContent:isTablet&&!isMobile?"center":"flex-start",borderRadius:8,background:"none",border:"none",cursor:"pointer",color:muted,fontFamily:"inherit",fontSize:13,width:"100%",marginBottom:4}}>
              <span className="material-icons-outlined" style={{fontSize:18}}>{dark?"light_mode":"dark_mode"}</span>
              {(!isTablet||isMobile)&&(dark?"Modo Claro":"Modo Escuro")}
            </button>
            {(!isTablet||isMobile)&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 12px"}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:teal,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{initials(currentUser?.name||"?")}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentUser?.name||"..."}</div>
                <div style={{fontSize:11,color:muted}}>{currentUser?.plan||"Starter"}</div>
              </div>
              <button onClick={()=>supabase.auth.signOut()} title="Sair" style={{background:"none",border:"none",cursor:"pointer",color:muted,padding:4,flexShrink:0}}>
                <span className="material-icons-outlined" style={{fontSize:18}}>logout</span>
              </button>
            </div>}
          </div>
        </aside>

        {/* MAIN */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <header style={{height:60,background:sidebar,borderBottom:`1px solid ${border}`,padding:`0 ${isMobile?16:28}px`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {isMobile&&<button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"none",cursor:"pointer",color:muted,padding:4}}>
                <span className="material-icons-outlined" style={{fontSize:24}}>menu</span>
              </button>}
              <h1 style={{fontSize:isMobile?16:18,fontWeight:700,color:text,whiteSpace:"nowrap"}}>{PAGE_TITLE}</h1>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              {!isMobile&&(page==="contacts"||page==="dashboard")&&<div style={{position:"relative"}}>
                <span className="material-icons-outlined" style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:muted,fontSize:17}}>search</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar..." style={{...INP,paddingLeft:32,width:180,fontSize:13}}/>
              </div>}
              {page==="contacts"&&<>
                <button onClick={()=>{setImportPrev([]);setImportErr("");setShowImport(true);}} style={{...BTNS,fontSize:13,padding:"8px 14px"}}>
                  <span className="material-icons-outlined" style={{fontSize:15}}>upload</span>{!isMobile&&"Importar"}
                </button>
                <button onClick={()=>{setEditContact({...EMPTY_C});setIsNewContact(true);}} style={{...BTNP,fontSize:13,padding:"8px 14px"}}>
                  <span className="material-icons-outlined" style={{fontSize:15}}>person_add</span>{!isMobile&&"Novo Contacto"}
                </button>
              </>}
              {page==="properties"&&<button onClick={()=>{setEditProperty({...EMPTY_P});setIsNewProperty(true);}} style={{...BTNP,fontSize:13,padding:"8px 14px"}}>
                <span className="material-icons-outlined" style={{fontSize:15}}>add_home</span>{!isMobile&&"Novo Imóvel"}
              </button>}
            </div>
          </header>

          {isMobile&&(page==="contacts"||page==="dashboard")&&<div style={{padding:"10px 16px",background:sidebar,borderBottom:`1px solid ${border}`}}>
            <div style={{position:"relative"}}>
              <span className="material-icons-outlined" style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:muted,fontSize:17}}>search</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar contactos..." style={{...INP,paddingLeft:32,fontSize:13}}/>
            </div>
          </div>}

          <main style={{flex:1,overflowY:"auto",padding:isMobile?14:26}}>

            {/* INÍCIO */}
            {page==="dashboard"&&<div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:isMobile?12:18,marginBottom:isMobile?16:26}}>
                {[{label:"Contactos",value:contacts.length,icon:"people",color:"#3b82f6",sub:"Total"},{label:"Leads Quentes",value:contacts.filter(c=>c.status==="Quente").length,icon:"local_fire_department",color:"#ef4444",sub:"Prontos"},{label:"Imóveis",value:properties.length,icon:"apartment",color:teal,sub:"Em carteira"},{label:"Matches",value:properties.reduce((acc,p)=>acc+getMatches(p).length,0),icon:"auto_awesome",color:"#8b5cf6",sub:"Potenciais"}].map((st,i)=>(
                  <div key={i} style={{...CARD,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div><div style={{fontSize:10,color:muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6,fontWeight:600}}>{st.label}</div><div style={{fontSize:isMobile?26:32,fontWeight:700,color:st.color,lineHeight:1}}>{st.value}</div><div style={{fontSize:11,color:muted,marginTop:5}}>{st.sub}</div></div>
                    <div style={{width:38,height:38,borderRadius:9,background:`${st.color}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><span className="material-icons-outlined" style={{color:st.color,fontSize:20}}>{st.icon}</span></div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?14:22}}>
                <div style={CARD}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <h3 style={{fontSize:15,fontWeight:700,color:text}}>Leads Quentes</h3>
                    <button onClick={()=>setPage("contacts")} style={{background:"none",border:"none",color:teal,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Ver todos →</button>
                  </div>
                  {contacts.filter(c=>c.status==="Quente").slice(0,5).map(c=>(
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${border}`}}>
                      <div style={{width:34,height:34,borderRadius:"50%",background:avatarColor(c.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{initials(c.name)}</div>
                      <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,color:text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div><div style={{fontSize:12,color:muted}}>{(c.interests||[]).join(", ")||"—"} · {(c.concelhos||[])[0]||"—"}</div></div>
                      <Badge status={c.status}/>
                    </div>
                  ))}
                  {!contacts.filter(c=>c.status==="Quente").length&&<div style={{textAlign:"center",padding:24,color:muted,fontSize:13}}>Sem leads quentes ainda.</div>}
                </div>
                <div style={CARD}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <h3 style={{fontSize:15,fontWeight:700,color:text}}>Imóveis para Enviar</h3>
                    <button onClick={()=>setPage("properties")} style={{background:"none",border:"none",color:teal,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Ver todos →</button>
                  </div>
                  {properties.slice(0,5).map(p=>{const ms=getMatches(p);return(
                    <div key={p.id} style={{padding:"11px 0",borderBottom:`1px solid ${border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                        <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:600,color:text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div><div style={{fontSize:12,color:muted,marginTop:2}}>{p.concelho||"—"} · {p.price?.toLocaleString("pt-PT")}€</div></div>
                        <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:11,color:"#10b981",fontWeight:600,marginBottom:5}}>{ms.length} interessados</div><button onClick={()=>setSendProp(p)} style={{...BTNP,padding:"6px 12px",fontSize:12}}>Enviar</button></div>
                      </div>
                    </div>
                  );})}
                  {!properties.length&&<div style={{textAlign:"center",padding:24,color:muted,fontSize:13}}>Sem imóveis ainda.</div>}
                </div>
              </div>
            </div>}

            {/* CONTACTOS */}
            {page==="contacts"&&<div>
              {!isMobile&&<div style={{...CARD,padding:"12px 18px",marginBottom:16,display:"flex",gap:12,alignItems:"flex-end"}}>
                <div><div style={{fontSize:11,fontWeight:700,color:muted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>Filtrar por Interesse</div>
                  <select value={filterInt} onChange={e=>setFilterInt(e.target.value)} style={{...INP,width:200,fontSize:13}}>
                    <option value="">Todos</option>{INTERESTS.map(i=><option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>}
              {isMobile?(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {filtered.map(c=>(
                    <div key={c.id} style={{...CARD,cursor:"pointer"}} onClick={()=>{setEditContact({...c,priceRange:c.price_range||c.priceRange||""});setIsNewContact(false);}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                        <div style={{width:40,height:40,borderRadius:"50%",background:avatarColor(c.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>{initials(c.name)}</div>
                        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:text}}>{c.name}</div><div style={{fontSize:12,color:muted}}>{c.phone}</div></div>
                        <Badge status={c.status}/>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>{(c.interests||[]).map(t=><span key={t} style={{padding:"2px 8px",borderRadius:20,fontSize:11,background:`${teal}18`,color:teal,fontWeight:600}}>{t}</span>)}</div>
                      <div style={{fontSize:12,color:muted}}>📍 {(c.concelhos||[]).join(", ")||"—"} · 💶 {c.price_range||c.priceRange||"—"}</div>
                    </div>
                  ))}
                  {!filtered.length&&<div style={{...CARD,textAlign:"center",padding:32,color:muted}}>Sem contactos ainda.<br/><button onClick={()=>{setEditContact({...EMPTY_C});setIsNewContact(true);}} style={{...BTNP,marginTop:16}}>Adicionar primeiro contacto</button></div>}
                </div>
              ):(
                <div style={{...CARD,padding:0,overflow:"hidden"}}>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr><th style={TH}>Contacto</th><th style={TH}>Localização</th><th style={TH}>Budget</th><th style={TH}>Interesses</th><th style={TH}>Estado</th><th style={{...TH,textAlign:"right"}}>Acções</th></tr></thead>
                      <tbody>{filtered.map(c=>(
                        <tr key={c.id} onMouseEnter={e=>e.currentTarget.style.background=hover} onMouseLeave={e=>e.currentTarget.style.background=""}>
                          <td style={TD}><div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:34,height:34,borderRadius:"50%",background:avatarColor(c.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{initials(c.name)}</div>
                            <div><div style={{fontWeight:600}}>{c.name}</div><div style={{fontSize:12,color:muted}}>{c.phone}</div></div>
                          </div></td>
                          <td style={TD}><div style={{fontWeight:500}}>{(c.concelhos||[]).join(", ")||"—"}</div><div style={{fontSize:11,color:muted}}>{(c.districts||[]).join(", ")||""}</div></td>
                          <td style={TD}><span style={{fontWeight:600}}>{c.price_range||c.priceRange||"—"}</span></td>
                          <td style={TD}><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{(c.interests||[]).map(t=><span key={t} style={{padding:"2px 7px",borderRadius:20,fontSize:11,background:`${teal}18`,color:teal,fontWeight:600}}>{t}</span>)}{!(c.interests||[]).length&&<span style={{color:muted,fontSize:12}}>—</span>}</div></td>
                          <td style={TD}><Badge status={c.status}/></td>
                          <td style={{...TD,textAlign:"right"}}><button onClick={()=>{setEditContact({...c,priceRange:c.price_range||c.priceRange||""});setIsNewContact(false);}} style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:6,color:muted}}><span className="material-icons-outlined" style={{fontSize:18}}>edit</span></button></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div style={{padding:"11px 18px",borderTop:`1px solid ${border}`,background:thead}}><span style={{fontSize:13,color:muted}}>A mostrar {filtered.length} de {contacts.length} contactos</span></div>
                </div>
              )}
            </div>}

            {/* IMÓVEIS */}
            {page==="properties"&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isTablet?"1fr 1fr":"repeat(auto-fill,minmax(360px,1fr))",gap:isMobile?14:20}}>
              {properties.map(p=><PropCard key={p.id} p={p} matchCount={getMatches(p).length} isMobile={isMobile} theme={theme}
                onEdit={()=>{setEditProperty({...p});setIsNewProperty(false);}}
                onSend={()=>setSendProp(p)}/>)}
              {!properties.length&&<div style={{...CARD,textAlign:"center",padding:40,color:muted,gridColumn:"1/-1"}}>Sem imóveis ainda.<br/><button onClick={()=>{setEditProperty({...EMPTY_P});setIsNewProperty(true);}} style={{...BTNP,marginTop:16}}>Adicionar primeiro imóvel</button></div>}
            </div>}

            {/* MATCHES */}
            {page==="matches"&&<div>
              <p style={{color:muted,marginBottom:20,fontSize:14}}>Contactos filtrados automaticamente por imóvel.</p>
              {[...properties].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map(p=>{const ms=getMatches(p);return(
                <div key={p.id} style={{...CARD,marginBottom:18}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
                    <div><h3 style={{fontSize:15,fontWeight:700,color:text}}>{p.title}</h3><div style={{fontSize:13,color:muted,marginTop:2}}>{p.concelho||"—"} · {p.typology} · {p.price?.toLocaleString("pt-PT")}€</div></div>
                    <button onClick={()=>setSendProp(p)} style={BTNP}><span className="material-icons-outlined" style={{fontSize:16}}>chat</span>Ver {ms.length} contactos</button>
                  </div>
                  {ms.length===0?(<div style={{textAlign:"center",padding:24,color:muted,fontSize:14,background:inp,borderRadius:10}}>Nenhum contacto com este perfil.</div>):(
                    isMobile?(
                      <div>{ms.map(c=>{const sc=getScore(c,p),scC=sc>=80?"#10b981":sc>=60?"#f59e0b":"#ef4444";return(
                        <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${border}`}}>
                          <div style={{width:32,height:32,borderRadius:"50%",background:avatarColor(c.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{initials(c.name)}</div>
                          <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{c.name}</div><div style={{fontSize:11,color:muted}}>{(c.concelhos||[]).join(", ")}</div></div>
                          <span style={{fontSize:12,fontWeight:700,color:scC}}>{sc}%</span>
                          <button onClick={()=>setSendProp(p)} style={{...BTNP,padding:"6px 10px",fontSize:11}}><span className="material-icons-outlined" style={{fontSize:13}}>chat</span></button>
                        </div>
                      );})}</div>
                    ):(
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead><tr><th style={TH}>Contacto</th><th style={TH}>Preferências</th><th style={TH}>Budget</th><th style={{...TH,textAlign:"center"}}>Score</th><th style={{...TH,textAlign:"right"}}>Acção</th></tr></thead>
                        <tbody>{ms.map(c=>{const sc=getScore(c,p),scC=sc>=80?"#10b981":sc>=60?"#f59e0b":"#ef4444";return(
                          <tr key={c.id}>
                            <td style={TD}><div style={{display:"flex",alignItems:"center",gap:9}}><div style={{width:30,height:30,borderRadius:"50%",background:avatarColor(c.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>{initials(c.name)}</div><div><div style={{fontWeight:600,fontSize:13}}>{c.name}</div><div style={{fontSize:11,color:muted}}>{c.phone}</div></div></div></td>
                            <td style={TD}><span style={{color:muted,fontSize:12}}>{(c.typologies||[]).join(", ")||"—"} · {(c.concelhos||[]).join(", ")||"—"}</span></td>
                            <td style={TD}><span style={{fontWeight:600,fontSize:13}}>{c.price_range||c.priceRange||"—"}</span></td>
                            <td style={{...TD,textAlign:"center"}}><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><div style={{width:48,height:5,background:border,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${sc}%`,background:scC,borderRadius:4}}/></div><span style={{fontSize:11,fontWeight:700,color:scC}}>{sc}%</span></div></td>
                            <td style={{...TD,textAlign:"right"}}><button onClick={()=>setSendProp(p)} style={{...BTNP,padding:"6px 12px",fontSize:12}}><span className="material-icons-outlined" style={{fontSize:14}}>chat</span>Enviar</button></td>
                          </tr>
                        );})}</tbody>
                      </table>
                    )
                  )}
                </div>
              );})}
              {!properties.length&&<div style={{...CARD,textAlign:"center",padding:40,color:muted}}>Adiciona imóveis para ver os matches.</div>}
            </div>}

            {/* CAMPANHAS */}
            {page==="campaigns"&&<div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:isMobile?12:16,marginBottom:20}}>
                {[["Enviados","0","#3b82f6","send"],["Entregues","0","#10b981","done_all"],["Visualizados","0",teal,"visibility"],["Respostas","0","#f59e0b","reply"]].map(([l,val,c,ic])=>(
                  <div key={l} style={{...CARD,display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{width:40,height:40,borderRadius:9,background:`${c}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span className="material-icons-outlined" style={{color:c,fontSize:20}}>{ic}</span></div>
                    <div><div style={{fontSize:10,color:muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{l}</div><div style={{fontSize:26,fontWeight:700,color:c}}>{val}</div></div>
                  </div>
                ))}
              </div>
              <div style={{...CARD,textAlign:"center",padding:40,color:muted}}>
                <span className="material-icons-outlined" style={{fontSize:40,display:"block",marginBottom:12}}>bar_chart</span>
                Histórico de campanhas em breve.
              </div>
            </div>}

            {/* REDES SOCIAIS */}
            {page==="social"&&<div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:16,marginBottom:20}}>
                {[{name:"Facebook",color:"#1877f2",icon:"f",connected:false,desc:"Publicação automática na sua página"},{name:"Instagram",color:"#e1306c",icon:"◈",connected:false,desc:"Posts e Stories automáticos"},{name:"WhatsApp Business",color:"#25d366",icon:"◉",connected:true,desc:"Envio directo para contactos"},{name:"Portal Imobiliário",color:teal,icon:"⬡",connected:false,desc:"Idealista · Imovirtual"}].map((sn,i)=>(
                  <div key={i} style={{...CARD,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{width:42,height:42,borderRadius:9,background:`${sn.color}18`,border:`1px solid ${sn.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:sn.color,flexShrink:0}}>{sn.icon}</div>
                      <div><div style={{fontWeight:600,fontSize:14,color:text}}>{sn.name}</div><div style={{fontSize:12,color:muted,marginTop:2}}>{sn.desc}</div></div>
                    </div>
                    <button style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${sn.connected?"#10b98144":border}`,background:sn.connected?"#10b98111":inp,color:sn.connected?"#10b981":muted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",flexShrink:0}}>{sn.connected?"✓ Ligado":"Ligar"}</button>
                  </div>
                ))}
              </div>
              <div style={CARD}>
                <h3 style={{fontSize:15,fontWeight:700,color:text,marginBottom:6}}>Agendamento de Publicações</h3>
                <p style={{fontSize:13,color:muted,marginBottom:18}}>Ligue as suas contas para activar o agendamento automático.</p>
                <div style={{border:`2px dashed ${border}`,borderRadius:12,padding:32,textAlign:"center"}}>
                  <span className="material-icons-outlined" style={{fontSize:36,color:muted,display:"block",marginBottom:10}}>schedule_send</span>
                  <div style={{fontSize:14,color:muted}}>Ligue pelo menos uma rede social para começar</div>
                </div>
              </div>
            </div>}

          </main>
        </div>
      </div>

      {/* MODALS */}
      {editContact&&<ContactForm contact={editContact} setContact={setEditContact} onSave={saveContact} onDelete={deleteContact} onClose={()=>setEditContact(null)} isNew={isNewContact} isMobile={isMobile} theme={theme}/>}
      {editProperty&&<PropertyForm property={editProperty} setProperty={setEditProperty} onSave={saveProperty} onDelete={deleteProperty} onClose={()=>setEditProperty(null)} isNew={isNewProperty} isMobile={isMobile} theme={theme} onPhotos={handlePhotos}/>}
      {sendProp&&<SendModal property={sendProp} contacts={contacts} onClose={()=>setSendProp(null)} isMobile={isMobile} theme={theme}/>}

      {/* IMPORT MODAL */}
      {showImport&&(
        <AppModal onClose={()=>setShowImport(false)} title="Importar Contactos" wide isMobile={isMobile} card={card} border={border} text={text} muted={muted}>
          <p style={{color:muted,fontSize:13,marginTop:-14,marginBottom:16}}>Importa via <strong style={{color:teal}}>.vcf</strong> ou <strong style={{color:teal}}>.csv</strong></p>
          {importPrev.length===0&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginBottom:16}}>
            {[["🤖","Android","1. App Contactos → ⋮\n2. Gerir contactos\n3. Exportar → VCF\n4. Envia para o PC"],["🍎","iPhone","1. icloud.com/contacts\n2. Seleccionar todos\n3. ⚙️ → Exportar vCard\n4. Descarrega .vcf"]].map(([ic,t,s])=>(
              <div key={t} style={{background:inp,border:`1px solid ${border}`,borderRadius:10,padding:14}}>
                <div style={{fontSize:20,marginBottom:6}}>{ic}</div><div style={{fontSize:13,fontWeight:700,color:text,marginBottom:6}}>{t}</div><div style={{fontSize:12,color:muted,lineHeight:1.8,whiteSpace:"pre-line"}}>{s}</div>
              </div>
            ))}
          </div>}
          {importPrev.length===0&&<label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:`2px dashed ${border}`,borderRadius:12,padding:24,cursor:"pointer",background:inp}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleImportFile({target:{files:[f],value:""}});}}>
            <input type="file" accept=".vcf,.csv" style={{display:"none"}} onChange={handleImportFile}/>
            <span className="material-icons-outlined" style={{fontSize:32,color:muted,marginBottom:8}}>upload_file</span>
            <div style={{fontSize:14,fontWeight:600,color:text,marginBottom:4}}>Clica ou arrasta</div>
            <div style={{fontSize:12,color:muted}}>Suporta .vcf e .csv</div>
          </label>}
          {importErr&&<div style={{background:"#ef444411",border:"1px solid #ef444433",borderRadius:8,padding:12,color:"#ef4444",fontSize:13,marginTop:10}}>⚠️ {importErr}</div>}
          {importPrev.length>0&&<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:14,color:"#10b981",fontWeight:600}}>✓ {importPrev.length} contactos encontrados</span>
              <button onClick={()=>setImportPrev([])} style={{background:"none",border:"none",color:muted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>← Outro ficheiro</button>
            </div>
            <div style={{background:inp,borderRadius:10,border:`1px solid ${border}`,maxHeight:220,overflowY:"auto"}}>
              {importPrev.slice(0,50).map((c,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderBottom:`1px solid ${border}`}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:teal,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>{(c.name||"?")[0].toUpperCase()}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:text}}>{c.name||"Sem nome"}</div><div style={{fontSize:12,color:muted}}>{c.phone}{c.email?` · ${c.email}`:""}</div></div>
                </div>
              ))}
              {importPrev.length>50&&<div style={{padding:"9px 14px",fontSize:12,color:muted}}>...e mais {importPrev.length-50} contactos</div>}
            </div>
          </div>}
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button onClick={()=>setShowImport(false)} style={{...BTNS,flex:1,justifyContent:"center"}}>Cancelar</button>
            {importPrev.length>0&&<button onClick={confirmImport} disabled={loading} style={{...BTNP,flex:2,justifyContent:"center",opacity:loading?0.7:1}}>
              {loading?"A importar...":"Importar "+importPrev.length+" contactos"}
            </button>}
          </div>
        </AppModal>
      )}
    </div>
  );
}
