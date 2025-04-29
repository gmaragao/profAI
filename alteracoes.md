## Components diagram

1. Adicionei o Orchestrator para ser o intermediario entre componentes e facilitar a comunicação entre eles
2. Mudei a notação para representar apenas o fluxo de dados
3. Mudei a notação para ficar mais adequado ao UML2

-> Testando langchain para ver se irá facilitar a integração da LLM com as tools do sistema
-> Se sim, vai ser mais facil a conexão direta com a DB, com chamadas da api e também a remoção do context builder

-> Ollama 3.2 não permite uso de tools diretamente com langchain, tentando llama3-groq-tool-use

-> MessageDispatcher vai ser assincrono para não sobrecarregar o sistema (filteredActions contém ações que vão ser tomadas no momento e ações que deverão ficar para depois de acordo com grau de importância para não sobrecarregar o sistema)


# Intent agent classifier ainda não está funcionando corretamente
